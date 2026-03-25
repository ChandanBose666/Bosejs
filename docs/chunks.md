# Core Concepts: Chunks and `$()`

## What is a chunk?

A **chunk** is a small JavaScript module that BoseJS extracts from your page at compile time. Each `$()` call becomes one chunk. The chunk is:

- Written to `public/chunks/chunk_<hash>.js` (dev) or emitted by Rollup (build)
- Never loaded on page load — only fetched on the first user interaction that needs it
- Self-contained: it receives the captured state as an argument, runs your logic, and returns updated signal values

The HTML carries two data attributes that tell the runtime how to resume:

```html
<button
  bose:on:click="chunks/chunk_a1b2c3d4e.js"
  bose:state='{"count":0}'
>
  Increment
</button>
```

When the user clicks, `bose-loader.js` fetches the chunk, passes the parsed `bose:state` JSON to it, and the chunk runs.

---

## What `$()` does at compile time

Given this source:

```js
const count = useSignal(0);

const increment = $(() => {
  count.value++;
});
```

The compiler:

1. Walks the function body and finds that `count` is referenced but defined outside — it is a **captured variable**.
2. Detects that `count` was created by `useSignal` — it is a **signal** (reconstructed in the chunk as `new Signal(state.count, 'count')`).
3. Generates a chunk file:

```js
/** BOSE GENERATED CHUNK: chunk_a1b2c3d4e **/
import { Signal } from '@bosejs/state';

export default function(state, element, event) {
  const count = new Signal(state.count, 'count');
  const logic = () => { count.value++; };
  logic(event);
  return { count: count.value };
}
```

4. Replaces `$(() => { ... })` in your source with a descriptor object:

```js
{
  chunk: 'chunks/chunk_a1b2c3d4e.js',
  props: ['count'],
  signals: ['count'],
  state: JSON.stringify({ count: count.value })
}
```

You reference `.chunk` for the `bose:on:*` attribute and `.state` for the `bose:state` attribute.

---

## What gets captured vs. what doesn't

The scope analyser tracks **every scope boundary** inside `$()`. Variables are only captured if they originate outside the `$()` function and are not created inside it.

### Captured (external scope)

```js
const greeting = "Hello";        // defined outside $()
const count = useSignal(0);       // defined outside $()

const action = $(() => {
  alert(greeting);    // greeting is captured
  count.value++;      // count is captured as a signal
});
```

### Not captured — arrow function parameters

```js
const action = $(() => {
  [1, 2, 3].forEach(item => {
    console.log(item);   // item is a param of the inner arrow — NOT captured
  });
});
```

### Not captured — `.find()`, `.map()`, `.filter()` callbacks

```js
const items = ['a', 'b', 'c'];  // captured — defined outside

const action = $(() => {
  const found = items.find(i => i === 'b');   // i is NOT captured
  const mapped = items.map(x => x.toUpperCase()); // x is NOT captured
});
```

### Not captured — catch clause parameters

```js
const action = $(() => {
  try {
    doSomething();
  } catch (err) {
    console.error(err);  // err is NOT captured — it is the catch param
  }
});
```

### Not captured — for-loop variables

```js
const action = $(() => {
  for (let i = 0; i < 10; i++) {
    console.log(i);     // i is NOT captured
  }

  for (const item of list) {
    process(item);      // item is NOT captured
  }
});
```

### Not captured — `let`/`const` locals declared inside `$()`

```js
const action = $(() => {
  const temp = computeSomething();   // temp is NOT captured
  let buffer = [];                   // buffer is NOT captured
});
```

---

## Working patterns

### Counter with a signal

```js
export default function Counter() {
  const count = useSignal(0);

  const increment = $(() => { count.value++; });
  const decrement = $(() => { count.value--; });

  return `
    <div>
      <p>Count: <span bose:bind="count">0</span></p>
      <button bose:on:click="${increment.chunk}" bose:state='${increment.state}'>+</button>
      <button bose:on:click="${decrement.chunk}" bose:state='${decrement.state}'>-</button>
    </div>
  `;
}
```

### Array operations with callbacks

```js
export default function FilterList() {
  const query = useSignal('');

  const search = $(() => {
    const items = ['apple', 'banana', 'cherry'];
    // .filter() callback param `item` is not captured — this is correct
    const results = items.filter(item => item.includes(query.value));
    document.getElementById('results').textContent = results.join(', ');
  });

  return `
    <input
      bose:on:input="${search.chunk}"
      bose:state='${search.state}'
      placeholder="Search..."
    />
    <p id="results"></p>
  `;
}
```

### try-catch inside a chunk

```js
const submit = $(async () => {
  try {
    const res = await fetch('/api/save', { method: 'POST' });
    const data = await res.json();
    status.value = 'saved';
  } catch (err) {
    // err is the catch param — not captured from outer scope
    status.value = 'error';
    console.error(err.message);
  }
});
```

### Server action called from a chunk

```js
export default function ProductPage({ params }) {
  const saveItem = server$(async (name) => {
    // This runs on the server — never ships to the browser
    return await db.items.insert({ name });
  });

  const handleSave = $(async () => {
    const result = await saveItem('New Item');
    alert(`Saved: ${result.id}`);
  });

  return `
    <button bose:on:click="${handleSave.chunk}" bose:state='${handleSave.state}'>
      Save Item
    </button>
  `;
}
```

`server$()` variables are **never included in `bose:state`**. The chunk inlines the RPC call directly using the action's stable hash ID.

---

## Common mistakes

### Mistake: passing an externally-defined function to `$()`

```js
// Wrong — BOSE_E001
const handler = () => { count.value++; };
const action = $(handler);
```

```js
// Correct
const action = $(() => { count.value++; });
```

### Mistake: using `.chunk` without `.state`

If your chunk captures signals, the chunk needs the current signal values at render time. Always pair `.chunk` with `.state`:

```js
// Wrong — the chunk has no state to resume from
<button bose:on:click="${action.chunk}">Click</button>

// Correct
<button bose:on:click="${action.chunk}" bose:state='${action.state}'>Click</button>
```

### Mistake: trying to capture a non-serializable value

`bose:state` is serialized as JSON. Only JSON-serializable values (strings, numbers, booleans, arrays, plain objects) can be captured. Functions, class instances, and `undefined` will silently serialize as `null` or be dropped.

```js
// Wrong — Date is not JSON-serializable
const deadline = new Date();
const action = $(() => { console.log(deadline); });

// Correct — serialize to a primitive first
const deadlineMs = Date.now();
const action = $(() => { console.log(new Date(deadlineMs)); });
```

---

## Debug mode

Set `window.__BOSE_DEBUG__ = true` or `localStorage.boseDebug = '1'` before the BoseJS runtime loads to enable verbose chunk-loading logs in the browser console.
