/**
 * Bose Pre-renderer
 * -----------------
 * Spins up the Vite dev server (reusing the full bosePlugin middleware stack),
 * fetches each static page, and writes the resulting HTML to dist/.
 *
 * Run after `vite build`:
 *   node scripts/prerender.mjs
 *
 * Dynamic routes (e.g. src/pages/product/[id].js) are skipped automatically —
 * add them to DYNAMIC_ROUTES below if you want to pre-render specific IDs.
 */

import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(ROOT, 'src', 'pages');
const DIST_DIR  = path.join(ROOT, 'dist');
const PORT      = 3099; // isolated port so it never clashes with the dev server

// Add entries here to pre-render dynamic routes, e.g.:
//   { route: '/product/1' }
//   { route: '/product/2' }
const DYNAMIC_ROUTES = [];

// ── helpers ────────────────────────────────────────────────────────────────

/** Walk src/pages/ and collect non-dynamic routes. */
function discoverStaticRoutes(dir, prefix = '') {
  const routes = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = entry.name;
    if (entry.isDirectory()) {
      routes.push(...discoverStaticRoutes(path.join(dir, name), `${prefix}/${name}`));
    } else if (/\.(js|md)$/.test(name) && !name.includes('[')) {
      const base  = name.replace(/\.(js|md)$/, '');
      const route = base === 'index' ? (prefix || '/') : `${prefix}/${base}`;
      routes.push(route);
    }
  }
  return routes;
}

/** Write HTML string to dist/<route>/index.html (or dist/index.html for /). */
function writeHtml(route, html) {
  const outPath =
    route === '/'
      ? path.join(DIST_DIR, 'index.html')
      : path.join(DIST_DIR, route.replace(/^\//, ''), 'index.html');

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf-8');
  return outPath;
}

// ── main ───────────────────────────────────────────────────────────────────

const routes = [
  ...discoverStaticRoutes(PAGES_DIR),
  ...DYNAMIC_ROUTES.map(r => r.route),
];

if (routes.length === 0) {
  console.error('[Bose Prerender] No pages found in', PAGES_DIR);
  process.exit(1);
}

console.log(`[Bose Prerender] Found ${routes.length} route(s): ${routes.join(', ')}`);

// Boot a temporary Vite dev server using the project config.
// This reuses the bosePlugin routing + SSR pipeline without any duplication.
const vite = await createServer({
  configFile: path.join(ROOT, 'vite.config.js'),
  server: { port: PORT, strictPort: true },
  logLevel: 'warn',
});

await vite.listen();
console.log(`[Bose Prerender] Vite server ready on :${PORT}`);

let ok = 0;
let failed = 0;

for (const route of routes) {
  try {
    const res  = await fetch(`http://localhost:${PORT}${route}`);
    const html = await res.text();

    if (!res.ok) {
      console.error(`[Bose Prerender] ✗ ${route} — HTTP ${res.status}`);
      failed++;
      continue;
    }

    const outPath = writeHtml(route, html);
    console.log(`[Bose Prerender] ✓ ${route} → ${path.relative(ROOT, outPath)}`);
    ok++;
  } catch (err) {
    console.error(`[Bose Prerender] ✗ ${route} — ${err.message}`);
    failed++;
  }
}

await vite.close();

// Copy server action modules to dist/actions/ so the production server can
// import() them. During prerender, isBuild=false (createServer creates a dev
// server), so the plugin writes actions to node_modules/.bose/actions/ instead
// of using emitFile. We copy them here after all pages have been rendered.
const actionSrcDir = path.join(ROOT, 'node_modules', '.bose', 'actions');
const actionDstDir = path.join(DIST_DIR, 'actions');
if (fs.existsSync(actionSrcDir)) {
  fs.mkdirSync(actionDstDir, { recursive: true });
  for (const file of fs.readdirSync(actionSrcDir)) {
    fs.copyFileSync(path.join(actionSrcDir, file), path.join(actionDstDir, file));
    console.log(`[Bose Prerender] action → dist/actions/${file}`);
  }
}

console.log(`\n[Bose Prerender] Done. ${ok} succeeded, ${failed} failed.`);
if (failed > 0) process.exit(1);
