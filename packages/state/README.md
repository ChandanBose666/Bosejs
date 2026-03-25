# @bosejs/state

> Fine-grained reactive signals for [Bosejs](https://github.com/ChandanBose666/Bosejs).

## Install

```bash
npm install @bosejs/state
```

## Usage

```js
import { useSignal } from '@bosejs/state';

export default function Counter() {
  const count = useSignal(0);

  const increment = $(() => { count.value++; });

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

## API

### `useSignal(initialValue)`

Creates a reactive signal.

```js
const count = useSignal(0);

count.value        // read: 0
count.value = 5   // write: triggers DOM update
```

### `bose:bind` (HTML attribute)

Bind a DOM node to a signal. The runtime updates the node's text content whenever the signal changes — no re-render, no diffing.

```html
<span bose:bind="count">0</span>
```

The attribute value must match the variable name used with `useSignal`.

## How signals survive resumption

When the page is SSR-rendered, signal values are serialized into `bose:state` attributes on interactive elements. When a lazy chunk runs in the browser, the runtime deserializes this state and reconstitutes the signals — so `count.value` always reflects the current state, not the initial server-rendered value.

## SSR Signal Hydration

By default, `useSignal(initialValue)` always renders with `initialValue` on the server.
Use `setSSRContext` in a page handler to seed the real server-side value before render:

```js
import { useSignal, setSSRContext } from '@bosejs/state';

export default async function CartPage({ params }) {
  // Seed from server context (cookie, DB, session, etc.)
  const count = await cartStore.getCount();
  setSSRContext({ 'cart-count': count });

  // Resolves to real count on the server, falls back to 0 in the browser
  const cartCount = useSignal(0, 'cart-count');

  return `<span bose:bind="cart-count">${cartCount.value}</span>`;
}
```

`setSSRContext` is a no-op in the browser. The Bose Vite plugin automatically
isolates each SSR request using `AsyncLocalStorage`, so concurrent requests
never share signal context.

## License

MIT © [Bosejs Contributors](https://github.com/ChandanBose666/Bosejs)
