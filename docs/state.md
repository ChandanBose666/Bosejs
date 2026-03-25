# State Management

BoseJS uses **signals** for reactivity — a fine-grained system where individual values notify only the DOM nodes that depend on them. There are no virtual DOM diffs and no component re-renders.

## Import

```js
import { useSignal } from '@bosejs/state';
```

In page files, `useSignal` and `$` are injected as globals by the BoseJS runtime, so you do not need the import statement. Use the explicit import in TypeScript files or utility modules outside of `src/pages/`.

---

## `useSignal(initialValue, id?)`

Creates a reactive signal.

```js
const count = useSignal(0);
const name  = useSignal('Alice');
const items = useSignal([]);
```

**The `id` parameter** is optional. The compiler automatically injects the variable name as the ID when you omit it:

```js
const count = useSignal(0);
// compiler transforms this to: useSignal(0, 'count')
```

Provide an explicit ID when you want two independent page sections to share the same signal (the "Nervous System" pattern):

```js
// In component A
const cartCount = useSignal(0, 'cart-count');

// In component B — same signal, same DOM bindings
const cartCount = useSignal(0, 'cart-count');
```

Both components will update the same `bose:bind="cart-count"` elements anywhere on the page.

---

## Reading and writing

```js
const count = useSignal(0);

// Read
console.log(count.value);  // 0

// Write — triggers DOM sync automatically
count.value = 5;
count.value++;
count.value += 10;
```

Setting `.value` to the same value is a no-op (strict equality check). Setting it to a new value calls `notify()`, which:

1. Updates every `<element bose:bind="<id>">` on the page via `textContent`
2. Updates every `bose:bind:style` binding
3. Keeps all `bose:state` attributes on interactive elements in sync

---

## DOM binding

### Text content

```html
<!-- Server renders the initial value inline -->
<span bose:bind="count">0</span>
```

When `count.value` changes, `bose-loader` sets `el.textContent = newValue` on every matching element. No re-render.

### Style binding

```html
<div bose:bind:style="color:accentColor">Hello</div>
```

When the `accentColor` signal changes, `el.style.color = newValue` is applied.

---

## `$$()` — Reactive computations

Reactive computations are not a separate API in BoseJS. Derive values inside `$()` chunks directly — computations re-run each time the chunk is invoked:

```js
const price = useSignal(100);
const qty   = useSignal(2);

const update = $(() => {
  const total = price.value * qty.value;
  document.getElementById('total').textContent = total;
});
```

For purely display-only derived values with no interaction, compute them at SSR time in the page function body and render them as static HTML.

---

## `setSSRContext(values)`

Seeds signal initial values for a single SSR request. Call it at the top of your page handler, before any `useSignal` calls.

```js
import { setSSRContext } from '@bosejs/state';

export default async function CartPage() {
  // Fetch real data on the server
  const cartItems = await db.cart.findAll();

  // Seed the signal context for this request
  setSSRContext({
    'cart-count': cartItems.length,
    'cart-total': cartItems.reduce((sum, i) => sum + i.price, 0),
  });

  // useSignal now picks up the seeded values instead of the fallback
  const cartCount = useSignal(0, 'cart-count');  // resolves to cartItems.length
  const cartTotal = useSignal(0, 'cart-total');  // resolves to real total

  return `
    <p>Items: <span bose:bind="cart-count">${cartCount.value}</span></p>
    <p>Total: $<span bose:bind="cart-total">${cartTotal.value}</span></p>
  `;
}
```

`setSSRContext` is a **no-op in the browser**. It uses `AsyncLocalStorage` internally, so values are scoped to the current request — concurrent requests never see each other's data.

---

## `getSSRContext()`

Returns all values set via `setSSRContext` for the current request. Useful for passing the context to a child function or for debugging.

```js
setSSRContext({ 'user-id': 42 });

const ctx = getSSRContext();
// ctx → { 'user-id': 42 }
```

Returns `undefined` in the browser or when called outside a request context.

---

## `Signal` class (advanced)

You do not normally construct `Signal` directly — use `useSignal`. The class is exported for type annotations and for use inside generated chunks.

```ts
import type { Signal } from '@bosejs/state';

function formatDisplay(signal: Signal<number>): string {
  return signal.value.toFixed(2);
}
```

### `signal.notify()`

Manually triggers DOM synchronization without changing the value. Useful when you mutate an object or array held by a signal (since mutation does not change the reference):

```js
const items = useSignal([]);

const addItem = $(() => {
  items.value.push('new item');
  items.notify();  // tell the runtime something changed
});
```

### `signal.toJSON()`

Returns the raw value. Called automatically by `JSON.stringify`, which is how the compiler serializes signal values into `bose:state`.

---

## TypeScript

All exports are fully typed. If your editor does not pick up types automatically, add a reference to the globals declaration:

```ts
// src/env.d.ts
/// <reference types="@bosejs/core/globals" />
```

This adds `$`, `server$`, `css$`, and `useSignal` to the global scope for TypeScript.
