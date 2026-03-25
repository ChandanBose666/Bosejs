# Bosejs High Priority Fixes — Design Spec

**Date:** 2026-03-25
**Status:** Approved
**Scope:** Two high-priority DX fixes surfaced during the ecommerce demo build

---

## Background

During a real-world ecommerce app build on Bosejs, two architectural gaps caused repeated workarounds:

1. `$()` chunks silently received `undefined` for captured module-scope variables (e.g. `css$()` class maps) because developers had to manually construct `bose:state` JSON and often omitted captured variables.
2. `useSignal` always initialised to its hardcoded fallback value on SSR — there was no mechanism to seed the true server-side value (e.g. cart count from a cookie or DB) before render.

---

## Fix 1 — Auto `bose:state` via the `state` property on the chunk descriptor

### Problem

The compiler already detects captured variables and emits `props: ['styles']` in the chunk descriptor object. But constructing the matching `bose:state` JSON attribute is left entirely to the developer:

```js
// Developer must know to include every captured variable manually:
bose:state='${JSON.stringify({ styles, count: count.value })}'
```

If any captured variable is omitted, the chunk silently receives `undefined` at runtime — no warning, wrong behaviour.

### Solution

The compiler generates a `state` property on the chunk descriptor object. This is a `JSON.stringify(...)` call expression emitted into the AST — it evaluates **at SSR render time** (when the component function runs on the server), not at Babel transform time. Therefore it captures live variable values.

**Naming note:** `state` is the property name on the descriptor object. The variable that holds the descriptor is whatever the developer names it (e.g. `handleClick`, `increment`). Template usage is always `${descriptorVar.state}`.

**Captured variable handling rules** (in `optimizer.js`)

| Variable type | Generated expression in `JSON.stringify` argument |
|---|---|
| Signal (from `useSignal`) | `varName: varName.value` — unwraps the Signal; serializes the primitive value only |
| Server action (from `server$()`) | excluded entirely — already inlined as a `fetch()` stub in the chunk |
| Everything else (css$ output, plain props, constants) | `varName` — shorthand, serialized as-is (must be JSON-serializable) |

**`props` vs `state` — both remain, different purposes:**

| Property | Type | Purpose |
|---|---|---|
| `props` | `string[]` | Names of captured variables. Used as metadata/documentation; informs tooling what the chunk depends on. **Not used by the runtime loader or chunk generator directly — keep as-is.** |
| `state` | `string` | Auto-generated `JSON.stringify(...)` expression. Evaluated at SSR render time to produce the actual `bose:state` attribute value. **New — replaces manual serialization in templates.** |

Both coexist. Removing `props` is out of scope and risks breaking any tooling that inspects it.

**Compiler output change** — in `optimizer.js`, inside the `isBoseMarker` branch, **after** the existing `stateVars` and `signalsArray` computations (lines 159–169 in the current file):

```js
// stateVars = variablesList.filter(v => !state.serverActionVars.has(v))  ← already computed
// signalsList = Set of signal var names                                    ← already computed
// signalsArray = Array.from(signalsList)                                   ← already computed

// NEW: build AST entries for each state variable
const stateEntries = stateVars.map(v =>
  t.objectProperty(
    t.identifier(v),
    signalsList.has(v)
      ? t.memberExpression(t.identifier(v), t.identifier('value'))  // count: count.value
      : t.identifier(v)                                               // styles: styles
  )
);

// Replace $(...) with the descriptor object — now includes `state`
babelPath.replaceWith(t.objectExpression([
  t.objectProperty(t.identifier('chunk'), t.stringLiteral(chunkPath)),
  t.objectProperty(t.identifier('props'), t.arrayExpression(stateVars.map(v => t.stringLiteral(v)))),
  t.objectProperty(t.identifier('signals'), t.arrayExpression(signalsArray.map(v => t.stringLiteral(v)))),
  t.objectProperty(
    t.identifier('state'),
    t.callExpression(
      t.memberExpression(t.identifier('JSON'), t.identifier('stringify')),
      [t.objectExpression(stateEntries)]
    )
  )
]));
```

This replaces the existing `babelPath.replaceWith(...)` call at the bottom of the `isBoseMarker` branch (lines 200–204 in the current file).

**Developer experience change:**

```html
<!-- Before (manual, error-prone) -->
bose:state='${JSON.stringify({ styles, count: count.value })}'

<!-- After (compiler-generated, always correct) -->
bose:state='${handleClick.state}'
```

**TypeScript — update `packages/core/types/globals.d.ts`:**

Add `state: string` to `BoseChunkDescriptor`:

```ts
interface BoseChunkDescriptor {
  chunk: string;
  props: string[];
  signals: string[];
  /** Auto-generated JSON string for direct use as the `bose:state` HTML attribute value.
   *  This is a serialized JSON object, not a parsed value. Use as: bose:state='${handle.state}' */
  state: string;
}
```

**TypeScript — update `packages/state/index.d.ts`:**

The `Signal` class is exported from `index.js` but missing from the d.ts (pre-existing gap). Add it now alongside the new `setSSRContext` export:

```ts
export class Signal<T = unknown> {
  readonly id: string;
  value: T;
  constructor(value: T, id: string);
  notify(): void;
  toJSON(): T;
}

export function useSignal<T>(initialValue: T, id?: string): Signal<T>;

// New in Fix 2:
export function setSSRContext(values: Record<string, unknown>): void;
```

**SSR safety net — update the dummy globals in `packages/core/vite-plugin.js`** (line 24):

```js
global.$ = () => ({ chunk: 'dummy.js', props: [], signals: [], state: '{}' });
```

(Adds `signals: []` and `state: '{}'` — both were missing from the current dummy.)

**Backwards compatibility:** Old manual `bose:state='${JSON.stringify({ ... })}'` patterns remain valid. The `state` property is purely additive.

---

## Fix 2 — Signal SSR Hydration via `setSSRContext`

### Problem

`useSignal(0, 'cart-count')` always starts at `0` on SSR. The real server-side value lives in the request context — but `useSignal` has no way to receive it. The signal badge renders `0`, then jumps to the real value after a `server$()` round-trip, causing a visible flash.

### Solution

`@bosejs/state` exports a new `setSSRContext(values)` function. Internally it writes to a **request-scoped store** backed by Node.js `AsyncLocalStorage`, guaranteeing isolation between concurrent requests.

`useSignal(initialValue, id)` checks the store on each call: if a value is registered for `id`, it supersedes `initialValue`.

### Implementation order

Fix 2 touches two packages. Apply the `state` package changes **first** (step A), then the `core` / Vite plugin changes (step B) so the `__ssrStorage` export is available when the Vite plugin imports it.

---

#### Step A — `packages/state/index.js`

Add the `AsyncLocalStorage` store using a **synchronous `require()` with try-catch** — not `await import()`, which cannot be used at module-level in a synchronous ESM file:

```js
// Node-only guard: synchronous require so this works at module load time.
// In the browser, require is undefined — the catch makes storage null safely.
let storage = null;
try {
  const { AsyncLocalStorage } = require('async_hooks');
  storage = new AsyncLocalStorage();
} catch {
  // Browser, Deno, or any environment without async_hooks — SSR context unavailable.
}

/**
 * Seed signal initial values for the current SSR request.
 * Must be called in the page handler before any `useSignal` call.
 * Safe to call multiple times — values are merged into the current context.
 * No-op in the browser or outside a storage.run() context.
 */
export function setSSRContext(values) {
  if (!storage) return;
  const store = storage.getStore();
  if (!store) return; // called outside storage.run() — safely ignored
  Object.assign(store, values);
}

// Updated useSignal — checks SSR context before falling back to initialValue
export function useSignal(initialValue, id) {
  let value = initialValue;
  if (storage && id) {
    const store = storage.getStore();
    if (store && Object.prototype.hasOwnProperty.call(store, id)) {
      value = store[id];
    }
  }
  return new Signal(value, id);
}

/** Exposed for the Vite plugin to create a fresh per-request context. */
export { storage as __ssrStorage };
```

---

#### Step B — `packages/core/vite-plugin.js`

**Import `__ssrStorage` at the top of the plugin factory** (after `@bosejs/state` is already imported via the `createRequire` pattern used for the runtime):

```js
// Add near other imports at the top of vite-plugin.js:
import { __ssrStorage } from '@bosejs/state';
```

**Wrap the route handler's `ssrLoadModule` call** in `storage.run({}, fn)`. This creates a fresh, isolated store for each page request. The **entire route rendering block** (module load + component call) must be inside the `run()` callback so `setSSRContext` calls inside the page component write to the correct request-scoped store.

Replace the existing route handler block in `configureServer` (lines 127–139 in the current file):

```js
// BEFORE:
let htmlContent = '';
try {
  const module = await server.ssrLoadModule(targetFile);
  const component = module.default;
  htmlContent = typeof component === 'function' ? await component({ params }) : component;
} catch (e) { ... }

// AFTER:
let htmlContent = '';
try {
  const runInContext = __ssrStorage
    ? (fn) => __ssrStorage.run({}, fn)  // fresh empty store per request
    : (fn) => fn();                      // fallback: storage unavailable (browser build)

  htmlContent = await runInContext(async () => {
    const module = await server.ssrLoadModule(targetFile);
    const component = module.default;
    return typeof component === 'function' ? await component({ params }) : component;
  });
} catch (e) { ... }
```

The RPC action handler (`/_bose_action`, lines 69–103) must **not** be wrapped — it executes server functions, not page components, and does not call `useSignal`.

---

**Developer experience:**

```js
// src/pages/cart.js
import { useSignal, setSSRContext } from '@bosejs/state';

export default async function CartPage({ params }) {
  // Seed real server value before any useSignal call in this render:
  const count = await cartStore.getCount();
  setSSRContext({ 'cart-count': count });

  // Resolves to `count`, not 0, on the server:
  const cartCount = useSignal(0, 'cart-count');

  return `<span bose:bind="cart-count">${cartCount.value}</span>`;
}
```

`useSignal`'s signature is unchanged. In the browser `storage` is `null`, so `useSignal` always falls back to `initialValue` as before.

---

## Files Changed

| File | Change |
|---|---|
| `packages/compiler/optimizer.js` | Add `stateEntries` array + `state` property to `$()` chunk descriptor AST output |
| `packages/state/index.js` | Add synchronous `AsyncLocalStorage` init; update `useSignal` to check store; export `setSSRContext` and `__ssrStorage` |
| `packages/state/index.d.ts` | Add `Signal` class export (pre-existing gap); add `setSSRContext` declaration |
| `packages/core/vite-plugin.js` | Update SSR dummy `$` global (`signals: []`, `state: '{}'`); import `__ssrStorage`; wrap route handler in `storage.run({}, ...)` |
| `packages/core/types/globals.d.ts` | Add `state: string` to `BoseChunkDescriptor` |
| `packages/core/README.md` | Update template example to use `handle.state` |
| `packages/state/README.md` | Document `setSSRContext` |

---

## What This Does Not Fix

The following issues were scoped out of this spec and deferred as follow-on work:

- `server$()` intent clarity (`"use server"` directive at definition site)
- Two-system reactivity unification (`bose:bind` vs `bose:on:*`)
- No cross-page state persistence (in-memory store resets on restart)
- Action module path resolution (`.bose/actions/` relative import bug)
- `ErrorBoundary` not exported from `@bosejs/core`

---

## Success Criteria

1. A `css$()` class map captured inside a `$()` handler is present in `descriptor.state` automatically — no manual `bose:state` construction required.
2. A Signal captured inside a `$()` handler serializes as `{ signalId: signal.value }` (the primitive), not the Signal object.
3. `useSignal(0, 'cart-count')` renders the actual server-side count when `setSSRContext({ 'cart-count': N })` is called before it in the same page render — no flash to `0` on load.
4. Concurrent SSR requests do not bleed signal context between users (each request runs in its own `AsyncLocalStorage` context via `storage.run({}, ...)`).
5. Existing manual `bose:state` patterns continue to work unchanged — the `state` property is additive.
6. In the browser, `setSSRContext` is a no-op and `useSignal` falls back to the hardcoded initial value as before.
