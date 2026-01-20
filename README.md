# Bosejs: The Hyper-Framework 🚀

Bosejs is a next-generation web framework that combines the flexibility of **Astro's Islands Architecture** with the "Zero-Hydration" performance of **Qwik's Resumability**.

It is designed to be "All-Powerful"—minimizing JavaScript to near zero while providing a seamless, type-safe developer experience.

## ✨ Core Pillars

### 1. Resumable Islands

While Astro introduced "Islands," Bosejs introduces **"Resumable Islands."** Instead of the browser re-running (hydrating) your component to attach event listeners, Bosejs serializes the event listeners and state directly into HTML. The browser "resumes" execution instantly on the first interaction.

### 2. The `$( )` Optimizer

Bosejs uses a custom Babel-based compiler that "shreds" your code. Every interaction wrapped in `$( )` is automatically extracted into its own lazy-loadable chunk. You write standard code; we handle the complex code-splitting.

### 3. Progressive Error Boundaries

Built-in error boundaries catch failures during the "Resumption" phase. If a specific interaction fails, Bosejs swaps in a fallback UI without crashing the rest of the page.

### 4. Zero-Fetch API Layer (Planned)

Coming soon: Call server-side functions (DB queries, API calls) directly from your client components with automatic RPC—no more `fetch()` or `Axios`.

---

## 🛠️ Project Structure

Bosejs is built as a monorepo for maximum modularity:

- `/packages/compiler`: The "Brain" - Babel plugins for closure extraction and scope analysis.
- `/packages/runtime`: The "Heart" - A tiny (<2KB) loader that manages event interception and resumption.
- `/packages/core`: The "Connector" - Official Vite plugin for a seamless dev experience.
- `/playground`: A live environment to test features and see "Zero-JS" in action.

---

## 🚀 Getting Started

Bosejs uses **Vite** for its build pipeline.

### Installation

```bash
git clone https://github.com/ChandanBose666/Bosejs.git
cd Bosejs
npm install
```

### Development

```bash
npm run dev
```

### How to use the `$( )` Optimizer

```javascript
import { useSignal } from "@bose/state";

export default function Counter() {
  const count = useSignal(0);

  // Everything in $() is automatically code-split by Bosejs
  const increment = $(() => {
    count.value++;
  });

  return <button onClick={increment}>Count is {count.value}</button>;
}
```

---

## 🗺️ Roadmap

- [x] Resumable Runtime (Loader)
- [x] Closure Extraction Compiler
- [x] Prop Serialization (State Capture)
- [x] Vite Integration
- [ ] Server Actions (Auto-RPC)
- [ ] Markdown & Astro-style Frontmatter support
- [ ] CSS-in-JS (Serialized)

---

## 📄 License

MIT

---

_Built with ❤️ to redefine web performance._
