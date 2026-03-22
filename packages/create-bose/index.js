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

// ── Helpers ──────────────────────────────────────────────────────────────────

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function file(...segments) {
  return path.join(targetDir, ...segments);
}

// ── package.json ─────────────────────────────────────────────────────────────

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

// ── vite.config.js ───────────────────────────────────────────────────────────

write(file('vite.config.js'), `\
import { defineConfig } from 'vite';
import bosePlugin from '@bosejs/core';

export default defineConfig({
  plugins: [bosePlugin()],
});
`);

// ── src/pages/index.js ───────────────────────────────────────────────────────
// This is the home page component — maps to the "/" route.
//
// Key concepts shown here:
//   useSignal  — import from @bosejs/state. Creates reactive state that
//                the compiler serialises into HTML for zero-hydration.
//
//   $( )       — a GLOBAL compiler marker (no import needed). The Bose
//                compiler extracts the closure into its own lazy chunk.
//                The page loads with 0 JS; the chunk is fetched only on
//                the first interaction.
//
//   bose:bind  — reactive text binding. Updated instantly by the runtime
//                when the signal changes — no re-render.
//
//   bose:state — serialised state embedded in HTML. The chunk reads this
//                on resumption so it never loses context.

write(file('src', 'pages', 'index.js'), `\
import { useSignal } from '@bosejs/state';

export default function Home() {
  // useSignal creates reactive state. The compiler injects a stable ID
  // so the runtime can sync DOM nodes to this signal after resumption.
  const count = useSignal(0);

  // $() is a global compiler marker — no import needed.
  // The closure is extracted into a separate JS chunk that is fetched
  // lazily on the first click. Until then, 0 bytes of JS are loaded.
  const increment = $(() => {
    count.value++;
  });

  const decrement = $(() => {
    count.value--;
  });

  const reset = $(() => {
    count.value = 0;
  });

  return \`
    <div style="
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #020617;
      color: #f8fafc;
    ">
      <h1 style="font-size: 2rem; margin-bottom: 0.25rem;">Bose Counter</h1>
      <p style="color: #94a3b8; margin-bottom: 3rem;">
        Resumable island &mdash; <strong>0 JS</strong> on page load.
      </p>

      <!-- bose:bind keeps this span in sync with the 'count' signal -->
      <div style="font-size: 6rem; font-weight: 900; line-height: 1; margin-bottom: 2rem;">
        <span bose:bind="count">\${count.value}</span>
      </div>

      <div style="display: flex; gap: 1rem;">
        <button
          style="padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: 1px solid #334155; background: #1e293b; color: #f8fafc; font-size: 1.25rem; cursor: pointer;"
          bose:on:click="\${decrement.chunk}"
          bose:state='\${JSON.stringify({ count: count.value })}'>
          −
        </button>

        <button
          style="padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: 1px solid #334155; background: #1e293b; color: #f8fafc; font-size: 1.25rem; cursor: pointer;"
          bose:on:click="\${reset.chunk}"
          bose:state='\${JSON.stringify({ count: count.value })}'>
          Reset
        </button>

        <button
          style="padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; background: #6366f1; color: #fff; font-size: 1.25rem; cursor: pointer;"
          bose:on:click="\${increment.chunk}"
          bose:state='\${JSON.stringify({ count: count.value })}'>
          +
        </button>
      </div>
    </div>
  \`;
}
`);

// ── .gitignore ────────────────────────────────────────────────────────────────

write(file('.gitignore'), `\
node_modules/
dist/
public/chunks/
bose-error.log
.env*.local
`);

// ── Done ─────────────────────────────────────────────────────────────────────

const steps = [
  `  cd ${projectName}`,
  `  npm install`,
  `  npm run dev`,
];

console.log('Done! Next steps:\n');
console.log(steps.join('\n'));
console.log('\nThen open http://localhost:5173\n');
