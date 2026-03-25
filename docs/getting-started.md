# Getting Started with BoseJS

BoseJS is a Vite-native web framework that combines **Islands Architecture** with **Resumability**. HTML ships with zero JavaScript by default. Interactivity loads lazily — only on first interaction, never on page load.

## Installation

You only need two packages. `@bosejs/compiler` and `@bosejs/runtime` install automatically as transitive dependencies of `@bosejs/core`.

```bash
npm install @bosejs/core @bosejs/state
```

> **Requires**: Node >= 18, Vite 4/5/6/7.

## Vite Configuration

Add the plugin to `vite.config.js`. That's all — the plugin auto-configures `optimizeDeps.exclude`, `ssr.noExternal`, and HMR for all BoseJS packages.

```js
// vite.config.js
import { defineConfig } from 'vite';
import bosePlugin from '@bosejs/core';

export default defineConfig({
  plugins: [bosePlugin()],
});
```

### Plugin options (all optional)

| Option | Default | Description |
|--------|---------|-------------|
| `outputDir` | `'public/chunks'` | Where extracted event-handler chunks are written |
| `pagesDir` | `'src/pages'` | Root directory for file-based routing |
| `actionEndpoint` | `'/_bose_action'` | HTTP endpoint for server actions (RPC) |

## Project Structure

```
my-app/
  src/
    pages/
      index.js        → /
      about.js        → /about
      product/
        [id].js       → /product/:id
  vite.config.js
  package.json
```

Pages in `src/pages/` are automatically served as routes — no router configuration needed. Both `.js` and `.md` files are supported.

## Your First Page

Create `src/pages/index.js`:

```js
export default function HomePage() {
  return `
    <div style="padding: 2rem;">
      <h1>Hello from BoseJS</h1>
      <p>This page ships zero JavaScript.</p>
    </div>
  `;
}
```

Pages are plain functions that return an HTML string. On the server BoseJS calls your function, wraps the result in a full HTML shell, and streams it to the browser.

## Adding Interactivity

Wrap any event handler in `$()` to make it resumable. The compiler extracts it into a lazy chunk; the HTML carries the chunk reference as a `bose:on:*` attribute.

```js
export default function Counter() {
  const count = useSignal(0);

  const increment = $(() => {
    count.value++;
  });

  return `
    <div>
      <p>Count: <span bose:bind="count">0</span></p>
      <button
        bose:on:click="${increment.chunk}"
        bose:state='${increment.state}'
      >
        Increment
      </button>
    </div>
  `;
}
```

- `useSignal` and `$` are global — no imports needed in page files.
- `bose:bind="count"` makes the `<span>` update automatically when `count.value` changes.
- `bose:state` carries serialized signal values into the HTML so the chunk can resume without re-running the page function.

## Running the Dev Server

```bash
npx vite
```

Or add a script to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

The dev server starts on port 3000 by default (or whichever port you set in `vite.config.js`). File-based routing, HMR, and SSR all work out of the box.

## Next Steps

- [Chunks](./chunks.md) — how `$()` extracts closures and what gets captured
- [State Management](./state.md) — signals, reactivity, and SSR seeding
- [SSR & Hydration](./ssr-hydration.md) — transferring server state to the browser
- [Error Reference](./errors.md) — compiler error codes and fixes
