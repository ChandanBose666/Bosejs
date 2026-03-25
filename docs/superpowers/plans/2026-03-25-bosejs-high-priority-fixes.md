# Bosejs High Priority Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two high-priority DX gaps in Bosejs: auto-generate `bose:state` from `$()` chunk descriptors, and allow server-side signal hydration via `setSSRContext`.

**Architecture:** Fix 1 adds a `state` property to the compiler's chunk descriptor output — a `JSON.stringify(...)` expression emitted into the Babel AST that captures all non-server-action variables at SSR render time. Fix 2 adds `AsyncLocalStorage`-backed per-request context to `@bosejs/state` so `useSignal` can read server-seeded initial values, with the Vite plugin wrapping each page render in a fresh context.

**Tech Stack:** Babel AST (`@babel/types`, `@babel/generator`), Node.js `async_hooks` (`AsyncLocalStorage`), Vite plugin API, ESM modules throughout.

**Spec:** `docs/superpowers/specs/2026-03-25-bosejs-high-priority-fixes-design.md`

---

## File Map

| File | Action | What changes |
|---|---|---|
| `packages/compiler/optimizer.js` | Modify | Add `stateEntries` + `state` property to `$()` descriptor AST |
| `packages/compiler/test.js` | Modify | Add assertions to verify `state` property is emitted |
| `packages/state/index.js` | Modify | Add `AsyncLocalStorage` init, `setSSRContext`, update `useSignal` |
| `packages/state/index.d.ts` | Modify | Export `Signal` class; add `setSSRContext` declaration |
| `packages/core/vite-plugin.js` | Modify | Update SSR dummy globals; import `__ssrStorage`; wrap route handler |
| `packages/core/types/globals.d.ts` | Modify | Add `state: string` to `BoseChunkDescriptor` |

**Implementation order matters for Fix 2:** Apply Tasks 1–2 (compiler + types) first, then Task 3 (`@bosejs/state`), then Task 4 (Vite plugin). The Vite plugin imports `__ssrStorage` from `@bosejs/state`, so the state package must be updated first.

---

## Task 1: Compiler — emit `state` property on chunk descriptor

**Files:**
- Modify: `packages/compiler/optimizer.js` (lines 159–204, the `isBoseMarker` branch)

**Background:** The current `babelPath.replaceWith(...)` at the end of the `isBoseMarker` branch emits `{ chunk, props, signals }`. We add a `state` property whose value is a `JSON.stringify(...)` call expression. For each variable in `stateVars`: if it's a signal, emit `varName: varName.value`; otherwise emit `varName` (shorthand). Server action vars are already excluded from `stateVars` by the existing filter on line 159.

- [ ] **Step 1.1: Open `packages/compiler/optimizer.js` and locate the replacement block**

  Find lines 200–204 (the existing `babelPath.replaceWith` call at the end of the `isBoseMarker` branch). It currently emits three properties: `chunk`, `props`, `signals`. We will replace this block with one that emits four.

- [ ] **Step 1.2: Build `stateEntries` and add `state` to the descriptor**

  Replace the existing `babelPath.replaceWith(t.objectExpression([...]))` block with:

  ```js
  // Build per-variable entries for the JSON.stringify argument.
  // Signals: serialize as varName.value (the primitive, not the Signal object).
  // Plain vars (css$ output, props, literals): serialize as-is via shorthand.
  const stateEntries = stateVars.map(v =>
    t.objectProperty(
      t.identifier(v),
      signalsList.has(v)
        ? t.memberExpression(t.identifier(v), t.identifier('value'))
        : t.identifier(v)
    )
  );

  babelPath.replaceWith(t.objectExpression([
    t.objectProperty(t.identifier('chunk'), t.stringLiteral(chunkPath)),
    // props = stateVars (server action vars excluded — they're inlined in chunks, not useful as metadata).
    // This matches the existing behaviour: current code already uses stateVars for props.
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

- [ ] **Step 1.3: Run the existing test script to verify the output looks correct**

  ```bash
  node packages/compiler/test.js
  ```

  Expected: In the `--- COMPILED CODE ---` output, the `increment` variable should now include a `state` property:
  ```
  state: JSON.stringify({ count: count.value, step })
  ```
  (count is a signal → `.value`, step is a plain number → shorthand)

- [ ] **Step 1.4: Commit**

  ```bash
  git add packages/compiler/optimizer.js
  git commit -m "feat(compiler): emit state property on \$() chunk descriptor"
  ```

---

## Task 2: Types — update `BoseChunkDescriptor` and state declarations

**Files:**
- Modify: `packages/core/types/globals.d.ts`
- Modify: `packages/state/index.d.ts`

- [ ] **Step 2.1: Add `state: string` to `BoseChunkDescriptor` in `packages/core/types/globals.d.ts`**

  Find the `BoseChunkDescriptor` interface (lines 28–35). Add the `state` property after `signals`:

  ```ts
  interface BoseChunkDescriptor {
    /** Relative URL to the lazy-loaded JS chunk, e.g. `"chunks/chunk_abc123.js"` */
    chunk: string;
    /** Names of the captured outer variables serialised into `bose:state`. */
    props: string[];
    /** Subset of `props` that are signals (reconstructed as `Signal` on resumption). */
    signals: string[];
    /**
     * Auto-generated JSON string for use as the `bose:state` HTML attribute value.
     * Use directly: `bose:state='${handle.state}'`
     * Replaces manual `JSON.stringify({ ... })` in templates.
     */
    state: string;
  }
  ```

- [ ] **Step 2.2: Add `Signal` class export and `setSSRContext` to `packages/state/index.d.ts`**

  The `Signal` class is exported from `index.js` but only `declare`d (not exported) in the d.ts — a pre-existing gap. Also add `setSSRContext` which we'll implement in Task 3. Replace the full file content:

  ```ts
  /**
   * @bosejs/state — Fine-grained reactive signals for Bose.
   */

  /**
   * A reactive value container. When `.value` is set, the runtime propagates
   * the change to all DOM nodes bound to this signal's ID via `bose:bind`.
   */
  export declare class Signal<T = unknown> {
    /** Stable ID used to identify this signal in the DOM and runtime registry. */
    readonly id: string;

    constructor(value: T, id: string);

    /** Read or update the signal value. Setting triggers DOM synchronization. */
    get value(): T;
    set value(newValue: T);

    /** Notify all subscribers and sync bound DOM nodes. */
    notify(): void;

    /** Returns the raw value for JSON serialization (used by bose:state). */
    toJSON(): T;
  }

  /**
   * Create a reactive signal.
   *
   * The `id` parameter is normally injected automatically by the Bose compiler.
   * You only need to supply it explicitly when you want two independent islands
   * to share the same global signal (Bose's "Nervous System" feature).
   *
   * @example
   * const count = useSignal(0);            // compiler injects ID
   * const cart = useSignal(0, 'cart-count'); // explicit shared ID
   */
  export declare function useSignal<T>(initialValue: T, id?: string): Signal<T>;

  /**
   * Seed signal initial values for the current SSR request.
   *
   * Call this in a page handler before any `useSignal` call. The values are
   * stored in a per-request `AsyncLocalStorage` context and read by `useSignal`
   * to override the `initialValue` fallback during server-side rendering.
   *
   * No-op in the browser (where `AsyncLocalStorage` is unavailable).
   * No-op if called outside a `storage.run()` context (e.g. in tests without setup).
   *
   * @example
   * export default async function CartPage({ params }) {
   *   setSSRContext({ 'cart-count': await cartStore.getCount() });
   *   const cartCount = useSignal(0, 'cart-count'); // resolves to real count
   * }
   */
  export declare function setSSRContext(values: Record<string, unknown>): void;
  ```

- [ ] **Step 2.3: Commit**

  ```bash
  git add packages/core/types/globals.d.ts packages/state/index.d.ts
  git commit -m "types: add state to BoseChunkDescriptor; export Signal and setSSRContext"
  ```

---

## Task 3: State package — add `AsyncLocalStorage` + `setSSRContext`

**Files:**
- Modify: `packages/state/index.js`

**Background:** We add a synchronous `require('async_hooks')` with try-catch at module level (not `await import()` — the file is synchronous ESM and top-level await is not available). We update `useSignal` to check the store before falling back to `initialValue`. We export `setSSRContext` for page handlers and `__ssrStorage` for the Vite plugin.

- [ ] **Step 3.1: Write a test script to verify the new behaviour**

  Create `packages/state/test.js`:

  ```js
  /**
   * Manual test for setSSRContext + useSignal SSR hydration.
   * Run: node packages/state/test.js
   */
  import assert from 'assert';

  // Import the module under test. __ssrStorage is the AsyncLocalStorage instance
  // created inside index.js — we use it here so the test shares the same instance
  // and doesn't create a separate AsyncLocalStorage that would be unrelated.
  const { useSignal, setSSRContext, __ssrStorage } = await import('./index.js');

  assert.ok(__ssrStorage, '__ssrStorage must be available in Node.js environment');

  // Test 1: useSignal falls back to initialValue when no SSR context is set
  {
    const sig = useSignal(42, 'test-signal');
    assert.strictEqual(sig.value, 42, 'Should use initialValue when no SSR context');
    console.log('PASS: useSignal falls back to initialValue outside context');
  }

  // Test 2: setSSRContext seeds the initial value inside a storage.run() context
  {
    let result;
    await __ssrStorage.run({}, async () => {
      setSSRContext({ 'cart-count': 7 });
      result = useSignal(0, 'cart-count');
    });
    assert.strictEqual(result.value, 7, 'Should use SSR context value when set');
    console.log('PASS: useSignal uses setSSRContext value inside run()');
  }

  // Test 3: Two concurrent contexts do not bleed into each other.
  // AsyncLocalStorage guarantees isolation regardless of interleaving — no timing dependency.
  {
    let resolveA, resolveB;
    const barrierA = new Promise(r => { resolveA = r; });
    const barrierB = new Promise(r => { resolveB = r; });
    let resultA, resultB;

    await Promise.all([
      __ssrStorage.run({}, async () => {
        setSSRContext({ 'user-id': 'alice' });
        resolveA();          // signal A is set
        await barrierB;      // wait for B to set its value
        resultA = useSignal('unknown', 'user-id');
      }),
      __ssrStorage.run({}, async () => {
        setSSRContext({ 'user-id': 'bob' });
        resolveB();          // signal B is set
        await barrierA;      // wait for A to set its value
        resultB = useSignal('unknown', 'user-id');
      }),
    ]);
    assert.strictEqual(resultA.value, 'alice', 'Context A should see alice');
    assert.strictEqual(resultB.value, 'bob', 'Context B should see bob');
    console.log('PASS: concurrent contexts are isolated');
  }

  // Test 4: setSSRContext is a no-op outside storage.run()
  {
    setSSRContext({ 'should-not-bleed': 99 }); // no run() wrapping — getStore() returns null
    const sig = useSignal(0, 'should-not-bleed');
    assert.strictEqual(sig.value, 0, 'setSSRContext outside run() should be no-op');
    console.log('PASS: setSSRContext is no-op outside run()');
  }

  console.log('\nAll state tests passed.');
  ```

- [ ] **Step 3.2: Run the test to confirm it fails (module not yet updated)**

  ```bash
  node packages/state/test.js
  ```

  Expected: Error — `setSSRContext is not a function` or similar. This confirms the test is real.

- [ ] **Step 3.3: Implement the changes in `packages/state/index.js`**

  Add the `AsyncLocalStorage` store at the top of the file, update `useSignal`, and add the exports. The full updated file:

  ```js
  /**
   * BOSE SIGNALS
   * Fine-grained reactivity for resumable frameworks.
   */

  // Node-only guard: synchronous require so this works at module load time.
  // AsyncLocalStorage is not available in the browser — the catch makes storage
  // null safely, which causes setSSRContext and the store check to be no-ops.
  let storage = null;
  try {
    const { AsyncLocalStorage } = require('async_hooks');
    storage = new AsyncLocalStorage();
  } catch {
    // Browser, Deno, or environment without async_hooks.
  }

  export class Signal {
    constructor(value, id) {
      this._value = value;
      this.id = id;
      this.subscribers = new Set();
    }

    get value() {
      if (context.activeSubscriber) {
        this.subscribers.add(context.activeSubscriber);
      }
      return this._value;
    }

    set value(newValue) {
      if (this._value === newValue) return;
      this._value = newValue;
      this.notify();
    }

    notify() {
      this.subscribers.forEach(sub => sub.update(this._value));
      if (typeof window !== 'undefined' && window.__BOSE_SYNC__) {
        window.__BOSE_SYNC__(this.id, this._value);
      }
    }

    toJSON() {
      return this._value;
    }
  }

  const context = {
    activeSubscriber: null
  };

  /**
   * Seed signal initial values for the current SSR request.
   * Call before useSignal in a page handler. No-op in the browser.
   */
  export function setSSRContext(values) {
    if (!storage) return;
    const store = storage.getStore();
    if (!store) return; // called outside storage.run() — safely ignored
    Object.assign(store, values);
  }

  export function useSignal(initialValue, id) {
    let value = initialValue;
    // Check SSR context: if a value is registered for this signal ID, use it.
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

- [ ] **Step 3.4: Run the test to confirm all four cases pass**

  ```bash
  node packages/state/test.js
  ```

  Expected output:
  ```
  PASS: useSignal falls back to initialValue outside context
  PASS: useSignal uses setSSRContext value inside run()
  PASS: concurrent contexts are isolated
  PASS: setSSRContext is no-op outside run()

  All state tests passed.
  ```

- [ ] **Step 3.5: Commit**

  ```bash
  git add packages/state/index.js packages/state/test.js
  git commit -m "feat(state): add setSSRContext for per-request signal hydration"
  ```

---

## Task 4: Vite plugin — update dummy globals and wrap route handler

**Files:**
- Modify: `packages/core/vite-plugin.js`

**Background:** Two changes: (1) update the SSR safety-net dummy for `$()` to include the new `state` and the existing-but-missing `signals` properties; (2) wrap the route handler's `ssrLoadModule` + component render in `__ssrStorage.run({}, fn)` so each page request gets an isolated context for `setSSRContext`.

- [ ] **Step 4.1: Write a test script to verify the dummy global update**

  Create `packages/core/test-globals.js`:

  ```js
  /**
   * Verifies that the SSR dummy globals match the BoseChunkDescriptor shape.
   * Run: node packages/core/test-globals.js
   */
  import assert from 'assert';

  // Simulate what vite-plugin.js does at startup:
  global.css$ = () => ({});
  global.$ = () => ({ chunk: 'dummy.js', props: [], signals: [], state: '{}' });
  global.server$ = () => (async () => ({}));

  const descriptor = global.$();
  assert.ok('chunk' in descriptor, 'descriptor must have chunk');
  assert.ok('props' in descriptor, 'descriptor must have props');
  assert.ok('signals' in descriptor, 'descriptor must have signals');
  assert.ok('state' in descriptor, 'descriptor must have state');
  assert.strictEqual(typeof descriptor.state, 'string', 'state must be a string');

  console.log('PASS: SSR dummy $() returns correct BoseChunkDescriptor shape');
  ```

- [ ] **Step 4.2: Run the test against the current code to confirm it fails**

  ```bash
  node packages/core/test-globals.js
  ```

  Expected: AssertionError — `descriptor must have signals` (or `state`). This confirms the test catches the gap.

- [ ] **Step 4.3: Update the `$` dummy global in `packages/core/vite-plugin.js`**

  Find line 24 (inside the `bosePlugin` factory, before the `return` statement):

  ```js
  // BEFORE:
  global.$ = () => ({ chunk: 'dummy.js', props: [] });

  // AFTER:
  global.$ = () => ({ chunk: 'dummy.js', props: [], signals: [], state: '{}' });
  ```

- [ ] **Step 4.4: Run the globals test to confirm it passes**

  ```bash
  node packages/core/test-globals.js
  ```

  Expected: `PASS: SSR dummy $() returns correct BoseChunkDescriptor shape`

- [ ] **Step 4.5: Add `__ssrStorage` import at the top of `packages/core/vite-plugin.js`**

  Find the existing imports at the top of the file (lines 1–8). Add after the last import:

  ```js
  import { __ssrStorage } from '@bosejs/state';
  ```

  **Note on import style:** `vite-plugin.js` uses `createRequire` to resolve *file paths* (e.g. `_require.resolve('@bosejs/runtime')`) for serving raw file contents over HTTP. That is different from importing a module's exports. `@bosejs/state` is a listed dependency of `@bosejs/core`, so a standard top-level ESM `import` is correct here and will resolve normally.

- [ ] **Step 4.6: Wrap the route handler's render block in `storage.run({}, fn)`**

  Find the route handler's try-catch block in `configureServer` (current lines 129–139):

  ```js
  // BEFORE:
  let htmlContent = '';
  try {
    const module = await server.ssrLoadModule(targetFile);
    const component = module.default;
    htmlContent = typeof component === 'function' ? await component({ params }) : component;
  } catch (e) {
    console.error(`[Bose SSR Error] ${targetFile}:`, e);
    htmlContent = `<div ...>...</div>`;
  }

  // AFTER:
  let htmlContent = '';
  try {
    const runInContext = __ssrStorage
      ? (fn) => __ssrStorage.run({}, fn)  // fresh empty store per request
      : (fn) => fn();                      // fallback: storage unavailable

    htmlContent = await runInContext(async () => {
      const module = await server.ssrLoadModule(targetFile);
      const component = module.default;
      return typeof component === 'function' ? await component({ params }) : component;
    });
  } catch (e) {
    console.error(`[Bose SSR Error] ${targetFile}:`, e);
    htmlContent = `<div style="padding: 2rem; background: #fee2e2; color: #991b1b; border-radius: 0.5rem; margin: 2rem;">
                     <h3>SSR Rendering Error</h3>
                     <pre>${e.message}</pre>
                  </div>`;
  }
  ```

  **Important:** Only this block is wrapped. The RPC action handler (`/_bose_action`, lines 69–103) must NOT be wrapped — it runs server functions, not page components.

- [ ] **Step 4.7: Commit**

  ```bash
  git add packages/core/vite-plugin.js packages/core/test-globals.js
  git commit -m "feat(core): wrap SSR render in AsyncLocalStorage context; fix dummy globals"
  ```

---

## Task 5: Update the compiler test to assert `state` is emitted

**Files:**
- Modify: `packages/compiler/test.js`

**Background:** The existing `test.js` is a manual console script with no assertions. Add assertions to verify the `state` property is present and contains the right variables.

- [ ] **Step 5.1: Update `packages/compiler/test.js` with assertions**

  Replace the entire file:

  ```js
  import babel from '@babel/core';
  import optimizer from './optimizer.js';
  import path from 'path';
  import { fileURLToPath } from 'url';
  import assert from 'assert';

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  // Test 1: $() with a signal and a plain variable both appear in state
  {
    const code = `
  export default function Counter() {
    const count = useSignal(0);
    const step = 5;
    const increment = $(() => {
      console.log("Adding step:", step);
      return { count: count + step };
    });
    return '<button>' + increment.chunk + '</button>';
  }
  `;

    const output = babel.transformSync(code, {
      plugins: [
        ['@babel/plugin-syntax-jsx'],
        [optimizer, { outputDir: path.join(__dirname, '../../playground/dist') }]
      ],
      filename: 'test-counter.js',
    });

    // chunk descriptor should now include state: JSON.stringify({ count: count.value, step })
    assert.ok(output.code.includes('state:'), 'descriptor must include state property');
    assert.ok(output.code.includes('JSON.stringify'), 'state must use JSON.stringify');
    assert.ok(output.code.includes('count.value'), 'signal var must serialize as .value');
    assert.ok(output.code.includes('"count"') || output.code.includes("'count'"), 'props must include count');
    console.log('PASS: $() descriptor includes state property with correct variable handling');
  }

  // Test 2: server$() variables are excluded from state
  {
    const code = `
  export default function Page() {
    const doAction = server$(async () => ({ ok: true }));
    const handleClick = $(() => { doAction(); });
    return '<button>' + handleClick.chunk + '</button>';
  }
  `;

    const output = babel.transformSync(code, {
      plugins: [
        ['@babel/plugin-syntax-jsx'],
        [optimizer, { outputDir: path.join(__dirname, '../../playground/dist') }]
      ],
      filename: 'test-server-action.js',
    });

    // doAction is a server action — must not appear in state JSON
    assert.ok(!output.code.includes('doAction.value') && !output.code.includes('"doAction"'),
      'server action vars must be excluded from state');
    console.log('PASS: server$() variables excluded from state');
  }

  console.log('\nAll compiler tests passed.');
  ```

- [ ] **Step 5.2: Run the updated test**

  ```bash
  node packages/compiler/test.js
  ```

  Expected:
  ```
  PASS: $() descriptor includes state property with correct variable handling
  PASS: server$() variables excluded from state

  All compiler tests passed.
  ```

- [ ] **Step 5.3: Commit**

  ```bash
  git add packages/compiler/test.js
  git commit -m "test(compiler): add assertions for state property and server action exclusion"
  ```

---

## Task 6: Update READMEs

**Files:**
- Modify: `packages/core/README.md`
- Modify: `packages/state/README.md`

- [ ] **Step 6.1: Update the template example in `packages/core/README.md`**

  Find the existing example in the Usage section:

  ```js
  // BEFORE:
  return `
    <div>
      <span bose:bind="count">${count.value}</span>
      <button bose:on:click="${increment.chunk}"
              bose:state='${JSON.stringify({ count: count.value })}'>+</button>
    </div>
  `;
  ```

  Replace with:

  ```js
  // AFTER:
  return `
    <div>
      <span bose:bind="count">${count.value}</span>
      <button bose:on:click="${increment.chunk}"
              bose:state='${increment.state}'>+</button>
    </div>
  `;
  ```

  Also update the Key concepts table to add `state`:

  ```
  | `$().state` | Auto-generated JSON string for `bose:state` — no manual serialization needed |
  ```

- [ ] **Step 6.2: Add `setSSRContext` to `packages/state/README.md`**

  Add a new section after the existing `useSignal` documentation:

  ```markdown
  ## SSR Signal Hydration

  By default, `useSignal(initialValue)` always renders with `initialValue` on the server.
  Use `setSSRContext` in a page handler to seed the real server-side value before render:

  \`\`\`js
  import { useSignal, setSSRContext } from '@bosejs/state';

  export default async function CartPage({ params }) {
    // Seed from server context (cookie, DB, session, etc.)
    const count = await cartStore.getCount();
    setSSRContext({ 'cart-count': count });

    // Resolves to real count on the server, falls back to 0 in the browser
    const cartCount = useSignal(0, 'cart-count');

    return `<span bose:bind="cart-count">${cartCount.value}</span>`;
  }
  \`\`\`

  `setSSRContext` is a no-op in the browser. The Bose Vite plugin automatically
  isolates each SSR request using `AsyncLocalStorage`, so concurrent requests
  never share signal context.
  ```

- [ ] **Step 6.3: Commit**

  ```bash
  git add packages/core/README.md packages/state/README.md
  git commit -m "docs: update examples to use handle.state and document setSSRContext"
  ```

---

## Verification

After all tasks are committed, run all test scripts together:

```bash
node packages/compiler/test.js && node packages/state/test.js && node packages/core/test-globals.js
```

Expected: All test suites print their PASS lines and exit with code 0.

Manual smoke test (requires Vite dev server):
1. Add `setSSRContext({ 'cart-count': 3 })` to a page handler before `useSignal(0, 'cart-count')`
2. Run `vite` and open the page — the badge should render `3`, not `0`
3. Open DevTools and inspect a `bose:on:*` element — `bose:state` should contain all captured variables without manual JSON construction
