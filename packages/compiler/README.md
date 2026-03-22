# @bosejs/compiler

> The Babel plugin that powers [Bosejs](https://github.com/ChandanBose666/Bosejs) — extracts `$()` closures into lazy resumable chunks.

## What it does

The compiler is the "brain" of Bosejs. It transforms your source files at build time:

1. **Finds every `$()` closure** in your component code
2. **Extracts it** into its own standalone JS chunk file
3. **Replaces it** with a reference object `{ chunk: 'chunk_abc123.js' }`
4. **Injects a stable signal ID** so the runtime can sync state on resumption

The result: your page ships with zero JS. Chunks are fetched lazily on first user interaction.

## Install

This package is installed automatically when you install `@bosejs/core`. You don't need to install it directly.

```bash
npm install @bosejs/core   # pulls in @bosejs/compiler automatically
```

## How `$()` works

You write:

```js
const increment = $(() => {
  count.value++;
});
```

The compiler outputs (in your page):

```js
const increment = { chunk: 'chunk_a1b2c3d4e.js', props: [] };
```

And creates `public/chunks/chunk_a1b2c3d4e.js`:

```js
// Lazily fetched only when the user first clicks
const { count } = __BOSE_STATE__;
count.value++;
```

Chunk IDs are deterministic (based on file content hash) — the same source always produces the same chunk ID across builds.

## License

MIT © [Bosejs Contributors](https://github.com/ChandanBose666/Bosejs)
