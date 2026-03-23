/**
 * Bose Production Server
 * ----------------------
 * Serves the pre-rendered static output from dist/ and handles
 * server$() RPC calls at POST /_bose_action.
 *
 * Usage:
 *   npm run build          # vite build + prerender
 *   node server.js         # serve on PORT (default 4000)
 *
 * Responsibilities:
 *   • Serve pre-rendered HTML from dist/
 *   • Serve static assets: dist/bose-runtime.js, dist/bose-state.js, dist/chunks/
 *   • Execute server$() actions from dist/actions/<actionId>.js
 */

import http from 'http';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR  = path.join(__dirname, 'dist');
const PORT      = process.env.PORT || 4000;
const ACTION_ENDPOINT = '/_bose_action';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff':  'font/woff',
};

// Cache for imported action modules so we only import() each one once.
const actionCache = new Map();

async function loadAction(id) {
  if (actionCache.has(id)) return actionCache.get(id);
  const actionPath = path.join(DIST_DIR, 'actions', `${id}.js`);
  if (!fs.existsSync(actionPath)) return null;
  const mod = await import(pathToFileURL(actionPath).href);
  actionCache.set(id, mod.default);
  return mod.default;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end',  () => resolve(body));
    req.on('error', reject);
  });
}

http.createServer(async (req, res) => {
  // ── POST /_bose_action — server$() RPC ──────────────────────────────────
  if (req.url === ACTION_ENDPOINT && req.method === 'POST') {
    try {
      const { id, args } = JSON.parse(await readBody(req));
      const fn = await loadAction(id);

      if (!fn) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: `Unknown action: ${id}` }));
        return;
      }

      const result = await fn(...args);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ── Static file serving ─────────────────────────────────────────────────
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  let urlPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, urlPath);

  // Route without extension → look for pre-rendered index.html
  if (!path.extname(filePath)) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    // Content-hashed assets (chunks, hashed filenames) are safe to cache forever.
    // Named entry files (bose-runtime.js, bose-state.js) change with each build
    // and must revalidate — never mark them immutable.
    const isHashed = /[a-f0-9]{8,}/.test(path.basename(filePath, ext));
    if (ext !== '.html' && isHashed) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (ext !== '.html') {
      res.setHeader('Cache-Control', 'no-cache');
    }
    res.end(fs.readFileSync(filePath));
    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Not found');

}).listen(PORT, () => {
  console.log(`[Bose] Production server → http://localhost:${PORT}`);
  console.log(`[Bose] Serving from: ${DIST_DIR}`);
});
