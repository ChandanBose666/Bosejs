#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const projectName = process.argv[2] || 'my-bose-app';
const targetDir = path.resolve(process.cwd(), projectName);

console.log(`\nCreating a new Bose app in ${targetDir}...\n`);

if (fs.existsSync(targetDir)) {
  console.error(`Error: Directory "${projectName}" already exists. Choose a different name.`);
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function file(...segments) {
  return path.join(targetDir, ...segments);
}

// ── package.json ──────────────────────────────────────────────────────────────

write(file('package.json'), JSON.stringify({
  name: projectName,
  version: '0.1.0',
  private: true,
  type: 'module',
  scripts: {
    dev: 'vite',
    build: 'vite build',
    preview: 'vite preview',
  },
  dependencies: {
    '@bosejs/core': 'latest',
    '@bosejs/state': 'latest',
  },
  devDependencies: {
    vite: 'latest',
  },
}, null, 2));

// ── vite.config.js ────────────────────────────────────────────────────────────

write(file('vite.config.js'), `\
import { defineConfig } from 'vite';
import bosePlugin from '@bosejs/core';

export default defineConfig({
  plugins: [bosePlugin()],
});
`);

// ── src/pages/index.js ────────────────────────────────────────────────────────
// Home page — showcases: useSignal, $(), bose:bind, bose:state, css$()
// Route: /

write(file('src', 'pages', 'index.js'), `\
import { useSignal } from '@bosejs/state';

export default function Home() {
  // useSignal — reactive state. The compiler injects a stable ID so the
  // runtime can sync any DOM node bound with bose:bind after resumption.
  const count = useSignal(0);

  // css$() — scoped styles extracted at build time. Zero runtime overhead.
  // Class names are hashed so there are no collisions across components.
  const s = css$(\`
    .wrap  { font-family: system-ui, sans-serif; min-height: 100vh; background: #020617; color: #f8fafc; margin: 0; }
    .nav   { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 2rem; border-bottom: 1px solid #1e293b; }
    .brand { font-weight: 800; font-size: 1.2rem; color: #f8fafc; text-decoration: none; }
    .links a { color: #94a3b8; text-decoration: none; font-size: 0.9rem; margin-left: 1.5rem; }
    .links a:hover { color: #f8fafc; }
    .hero  { text-align: center; padding: 4rem 2rem 2.5rem; }
    .title { font-size: clamp(2rem, 6vw, 3.75rem); font-weight: 900; margin: 0 0 1rem; }
    .sub   { color: #94a3b8; font-size: 1.1rem; max-width: 500px; margin: 0 auto 2rem; line-height: 1.7; }
    .pills { display: flex; gap: 0.6rem; justify-content: center; flex-wrap: wrap; margin-bottom: 3rem; }
    .pill  { padding: 0.3rem 0.85rem; border-radius: 99px; font-size: 0.75rem; font-weight: 600; }
    .pBlue   { background: #172554; color: #93c5fd; }
    .pPurple { background: #2e1065; color: #c4b5fd; }
    .pGreen  { background: #14532d; color: #86efac; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1.25rem; max-width: 840px; margin: 0 auto 3.5rem; padding: 0 2rem; }
    .card  { background: #0f172a; border: 1px solid #1e293b; border-radius: 0.75rem; padding: 1.5rem; }
    .icon  { font-size: 1.5rem; margin-bottom: 0.6rem; }
    .ctitle { font-size: 0.95rem; font-weight: 700; margin: 0 0 0.4rem; }
    .cbody  { font-size: 0.85rem; color: #64748b; line-height: 1.6; margin: 0; }
    .demo  { text-align: center; padding: 0 2rem 2.5rem; }
    .hint  { color: #475569; font-size: 0.82rem; margin-bottom: 1.25rem; }
    .num   { font-size: 6rem; font-weight: 900; color: #6366f1; line-height: 1; margin-bottom: 1.25rem; }
    .row   { display: flex; gap: 0.75rem; justify-content: center; }
    .btn   { padding: 0.65rem 1.5rem; border-radius: 0.5rem; border: 1px solid #334155; background: #1e293b; color: #f8fafc; font-size: 1.1rem; cursor: pointer; }
    .btnP  { background: #6366f1; border-color: #6366f1; }
    .foot  { text-align: center; padding: 2rem; border-top: 1px solid #1e293b; color: #475569; font-size: 0.85rem; }
    .foot a { color: #6366f1; text-decoration: none; }
  \`);

  // $() — global compiler marker. No import needed.
  // Each closure is extracted into its own lazy JS chunk at build time.
  // 0 bytes of JS ship with the page — chunks are fetched on first use.
  const increment = $(() => { count.value++; });
  const decrement = $(() => { count.value--; });
  const reset     = $(() => { count.value = 0; });

  return \`
    <div class="\${s.wrap}">

      <nav class="\${s.nav}">
        <a href="/" class="\${s.brand}">Bosejs</a>
        <div class="\${s.links}">
          <a href="/">Home</a>
          <a href="/about">About</a>
        </div>
      </nav>

      <div class="\${s.hero}">
        <h1 class="\${s.title}">Resumable Islands</h1>
        <p class="\${s.sub}">
          Zero JS on page load. Closures extracted at build time,
          resumed on first interaction — no hydration, no virtual DOM.
        </p>
        <div class="\${s.pills}">
          <span class="\${s.pill} \${s.pBlue}">Zero Hydration</span>
          <span class="\${s.pill} \${s.pPurple}">Lazy Chunks</span>
          <span class="\${s.pill} \${s.pGreen}">Fine-Grained Signals</span>
        </div>
      </div>

      <div class="\${s.cards}">
        <div class="\${s.card}">
          <div class="\${s.icon}">⚡</div>
          <p class="\${s.ctitle}">Zero Hydration</p>
          <p class="\${s.cbody}">State is serialized into HTML. The browser resumes execution — never re-runs your code.</p>
        </div>
        <div class="\${s.card}">
          <div class="\${s.icon}">✂️</div>
          <p class="\${s.ctitle}">Automatic Code Splitting</p>
          <p class="\${s.cbody}">Wrap any logic in <code>\$()</code> and the compiler extracts it into a lazy chunk — 0 bytes until needed.</p>
        </div>
        <div class="\${s.card}">
          <div class="\${s.icon}">🔗</div>
          <p class="\${s.ctitle}">Reactive Signals</p>
          <p class="\${s.cbody}"><code>useSignal</code> creates fine-grained reactive state. DOM updates are surgical — no diffing.</p>
        </div>
      </div>

      <div class="\${s.demo}">
        <p class="\${s.hint}">Open DevTools → Network → click a button to see the lazy chunk load</p>
        <!-- bose:bind keeps this span in sync with the 'count' signal -->
        <div class="\${s.num}">
          <span bose:bind="count">\${count.value}</span>
        </div>
        <div class="\${s.row}">
          <button class="\${s.btn}"
            bose:on:click="\${decrement.chunk}"
            bose:state='\${JSON.stringify({ count: count.value })}'>−</button>
          <button class="\${s.btn}"
            bose:on:click="\${reset.chunk}"
            bose:state='\${JSON.stringify({ count: count.value })}'>Reset</button>
          <button class="\${s.btn} \${s.btnP}"
            bose:on:click="\${increment.chunk}"
            bose:state='\${JSON.stringify({ count: count.value })}'>+</button>
        </div>
      </div>

      <div class="\${s.foot}">
        <a href="/about">Read the docs →</a>
      </div>

    </div>
  \`;
}
`);

// ── src/pages/about.md ────────────────────────────────────────────────────────
// Markdown page — showcases file-based routing with .md files.
// Route: /about

write(file('src', 'pages', 'about.md'), `\
---
title: About Bosejs
---

# About Bosejs

Bosejs combines Astro's Islands Architecture with Qwik's Resumability to deliver
web pages that ship **zero JavaScript** until the user interacts.

---

## How it works

1. **You write standard JS** — functions, closures, signals. No new syntax to learn.
2. **The compiler shreds it** — every \`$()\` closure is extracted into its own chunk at build time.
3. **HTML ships with 0 JS** — event handlers live as HTML attributes; state is serialized inline.
4. **On first interaction** — the runtime fetches only the chunk needed. Execution resumes instantly.

---

## Core concepts

### \`$()\` — Lazy closure extraction

Wrap any event handler in \`$()\`. The Babel compiler extracts it into a separate JS file.
No import needed — \`$\` is a global injected by the framework.

\`\`\`js
const increment = $(() => {
  count.value++;
});

// In your HTML:
// bose:on:click="\${increment.chunk}"
\`\`\`

### \`useSignal\` — Reactive state

Fine-grained reactive state from \`@bosejs/state\`. DOM nodes bound with
\`bose:bind\` update surgically when the signal changes — no re-render, no diffing.

\`\`\`js
import { useSignal } from '@bosejs/state';

const count = useSignal(0);
// <span bose:bind="count">\${count.value}</span>
\`\`\`

### \`bose:state\` — Serialized context

State is embedded directly in HTML so the chunk always has the context it needs
on resumption — even after the page has been cached or served from a CDN.

\`\`\`html
<button
  bose:on:click="\${increment.chunk}"
  bose:state='{"count":0}'>
  +
</button>
\`\`\`

### \`css$()\` — Scoped styles

Write CSS next to your component. Styles are extracted at build time and scoped
automatically. Zero runtime overhead.

\`\`\`js
const s = css$(\`.btn { background: #6366f1; color: white; }\`);
// <button class="\${s.btn}">Click me</button>
\`\`\`

### File-based routing

Drop a file in \`src/pages/\` and it becomes a route automatically.

| File | Route |
|---|---|
| \`src/pages/index.js\` | \`/\` |
| \`src/pages/about.md\` | \`/about\` |
| \`src/pages/product/[id].js\` | \`/product/123\` |

---

## Packages

| Package | You install? | Role |
|---|---|---|
| \`@bosejs/core\` | ✅ Yes | Vite plugin — routing, SSR, dev server |
| \`@bosejs/state\` | ✅ Yes | Signals — \`useSignal\` |
| \`@bosejs/compiler\` | 🔧 Auto | Babel plugin — extracts \`$()\` closures |
| \`@bosejs/runtime\` | 🔧 Auto | Tiny browser loader — resumes event handlers |

---

[← Back to home](/)
`);

// ── .gitignore ────────────────────────────────────────────────────────────────

write(file('.gitignore'), `\
node_modules/
dist/
public/chunks/
bose-error.log
.env*.local
`);

// ── Done ──────────────────────────────────────────────────────────────────────

const steps = [
  `  cd ${projectName}`,
  `  npm install`,
  `  npm run dev`,
];

console.log('Done! Next steps:\n');
console.log(steps.join('\n'));
console.log('\nThen open http://localhost:5173\n');
console.log('Pages:\n  /        → Home (signals, lazy chunks, css$)\n  /about   → Docs (markdown routing)\n');
