# create-bose

> Scaffold a new **Bosejs** application in seconds.

```bash
npx create-bose my-app
cd my-app
npm install
npm run dev
```

Open `http://localhost:5173` — a fully working Bosejs app with **zero JS on page load**.

---

## What is Bosejs?

Bosejs is a next-generation web framework that ships pages with **zero JavaScript** until the user interacts. It combines two ideas from modern frameworks:

- **Astro's Islands Architecture** — only interactive parts load JS
- **Qwik's Resumability** — the browser *resumes* execution instead of re-running (hydrating) your code

The result: instant page loads, lazy-fetched interaction chunks, and fine-grained reactive state — all with standard JavaScript syntax.

---

## What gets created

```
my-app/
├── src/
│   └── pages/
│       ├── index.js     ← Home page (signals, lazy chunks, css$, bose:bind)
│       └── about.md     ← Docs page (markdown routing with frontmatter)
├── vite.config.js
├── package.json
└── .gitignore
```

Two pages out of the box — proving file-based routing, signals, lazy chunks, scoped CSS, and markdown all work together.

---

## Features demonstrated in the scaffold

| Feature | Where | What it shows |
|---|---|---|
| `useSignal` | `index.js` | Reactive state serialized into HTML |
| `bose:bind` | `index.js` | DOM node synced to a signal — no re-render |
| `$()` | `index.js` | Closure extracted into a lazy JS chunk at build time |
| `bose:state` | `index.js` | State embedded in HTML for zero-hydration resumption |
| `css$()` | `index.js` | Scoped styles extracted at build time, zero runtime cost |
| Markdown routing | `about.md` | `.md` file automatically becomes the `/about` route |
| File-based routing | Both pages | Files in `src/pages/` map to URLs automatically |

---

## Core concepts

### `$()` — Lazy closure extraction

Wrap any event handler in `$()`. The Babel compiler extracts it into a separate JS chunk at build time. The page loads with **0 JS** — the chunk is fetched only when the user first interacts.

```js
import { useSignal } from '@bosejs/state';

export default function Counter() {
  const count = useSignal(0);

  // $() is a global — no import needed.
  // This closure becomes its own JS file: chunk_a1b2c3.js
  const increment = $(() => {
    count.value++;
  });

  return `
    <span bose:bind="count">${count.value}</span>
    <button
      bose:on:click="${increment.chunk}"
      bose:state='${JSON.stringify({ count: count.value })}'>
      +
    </button>
  `;
}
```

Open DevTools → Network → click the button. You'll see `chunk_*.js` load **once**, then never again (browser cache).

### `useSignal` — Reactive state

```js
import { useSignal } from '@bosejs/state';

const count = useSignal(0);

count.value       // read
count.value = 5   // write — syncs any bose:bind node instantly
```

### `css$()` — Scoped styles

```js
const s = css$(`
  .btn { background: #6366f1; color: white; padding: 0.5rem 1rem; }
`);

// <button class="${s.btn}">Click</button>
```

Styles are extracted at build time and scoped automatically. Zero runtime overhead.

### File-based routing

| File | Route |
|---|---|
| `src/pages/index.js` | `/` |
| `src/pages/about.md` | `/about` |
| `src/pages/blog/[slug].js` | `/blog/hello-world` |

---

## Manual installation (existing project)

```bash
npm install @bosejs/core @bosejs/state
```

```js
// vite.config.js
import { defineConfig } from 'vite';
import bosePlugin from '@bosejs/core';

export default defineConfig({
  plugins: [bosePlugin()],
});
```

> `@bosejs/compiler` and `@bosejs/runtime` install automatically as dependencies of `@bosejs/core`.

---

## Packages

| Package | Install? | Role |
|---|---|---|
| `@bosejs/core` | ✅ Yes | Vite plugin — routing, SSR, dev server |
| `@bosejs/state` | ✅ Yes | Signals — `useSignal` |
| `@bosejs/compiler` | 🔧 Auto | Babel plugin — extracts `$()` closures into lazy chunks |
| `@bosejs/runtime` | 🔧 Auto | Tiny (<2KB) browser loader — resumes event handlers |

---

## Links

- [GitHub](https://github.com/ChandanBose666/Bosejs)
- [@bosejs/core on npm](https://www.npmjs.com/package/@bosejs/core)
- [@bosejs/state on npm](https://www.npmjs.com/package/@bosejs/state)

---

## License

MIT © [Bosejs Contributors](https://github.com/ChandanBose666/Bosejs)
