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

## License

MIT © [Bosejs Contributors](https://github.com/ChandanBose666/Bosejs)
