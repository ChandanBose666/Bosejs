# @bosejs/runtime

> The tiny browser loader for [Bosejs](https://github.com/ChandanBose666/Bosejs) — resumes event handlers without hydration.

## What it does

The runtime is the "heart" of Bosejs. It's a small (<2KB) script that runs in the browser and:

1. **Intercepts events** via a single delegated listener on `document`
2. **Reads `bose:on:*` attributes** to find which chunk handles the event
3. **Fetches the chunk** lazily on first interaction (subsequent clicks use the cached module)
4. **Deserializes `bose:state`** and injects it into the chunk as `__BOSE_STATE__`
5. **Executes the handler** — the island "resumes" from exactly where the server left off
6. **Syncs signals** — updates any DOM node with a matching `bose:bind` attribute

## Install

This package is installed automatically when you install `@bosejs/core`. You don't need to install it directly.

```bash
npm install @bosejs/core   # pulls in @bosejs/runtime automatically
```

## How resumption works

Your HTML looks like this after SSR:

```html
<span bose:bind="count">0</span>
<button
  bose:on:click="chunk_a1b2c3.js"
  bose:state='{"count":0}'>
  +
</button>
```

On first click, the runtime:
- Fetches `chunk_a1b2c3.js` (one network request, then cached)
- Injects `{ count: signal(0) }` as `__BOSE_STATE__`
- Runs the chunk (`count.value++`)
- Finds `<span bose:bind="count">` and updates it to `1`

No framework boot. No virtual DOM. No re-render.

## License

MIT © [Bosejs Contributors](https://github.com/ChandanBose666/Bosejs)
