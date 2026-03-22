# @bosejs/core

> The Vite plugin for [Bosejs](https://github.com/ChandanBose666/Bosejs) — Resumable Islands for the modern web.

## What is Bosejs?

Bosejs combines Astro's Islands Architecture with Qwik's Resumability. Pages ship with **zero JavaScript**. Event handlers are serialized into HTML and resumed on first interaction — no hydration, no virtual DOM.

## Install

```bash
npm install @bosejs/core @bosejs/state
```

> `@bosejs/compiler` and `@bosejs/runtime` are installed automatically as dependencies.

## Usage

```js
// vite.config.js
import { defineConfig } from 'vite';
import bosePlugin from '@bosejs/core';

export default defineConfig({
  plugins: [bosePlugin()],
});
```

Create a page in `src/pages/index.js`:

```js
import { useSignal } from '@bosejs/state';

export default function Home() {
  const count = useSignal(0);

  const increment = $(() => { count.value++; });

  return `
    <div>
      <span bose:bind="count">${count.value}</span>
      <button bose:on:click="${increment.chunk}"
              bose:state='${JSON.stringify({ count: count.value })}'>+</button>
    </div>
  `;
}
```

Run `vite` and open `http://localhost:5173`. The page loads with **0 JS** — the `increment` chunk is fetched only on first click.

## Scaffold a new project

```bash
npx create-bose my-app
```

## Key concepts

| Concept | What it does |
|---|---|
| `$()` | Extracts the closure into a lazy JS chunk at build time |
| `useSignal` | Creates reactive state serialized into HTML |
| `bose:bind` | Binds a DOM node to a signal — updates surgically |
| `bose:on:*` | Attaches a lazy event handler |
| `bose:state` | Serializes state into HTML for resumption |
| `css$()` | Scoped CSS extracted at build time, zero runtime cost |
| `server$()` | Marks a function as server-only (Auto-RPC) |

## File-based routing

Drop files in `src/pages/` — they become routes automatically.

- `src/pages/index.js` → `/`
- `src/pages/about.md` → `/about`
- `src/pages/product/[id].js` → `/product/123`

## License

MIT © [Bosejs Contributors](https://github.com/ChandanBose666/Bosejs)
