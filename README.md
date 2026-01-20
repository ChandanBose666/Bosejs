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

### 4. Zero-Fetch API Layer (Auto-RPC)

Call server-side functions (DB queries, API calls) directly from your client components with automatic RPC—Bose handles the entire network layer for you.

---

## 🛠️ Project Structure

Bosejs is built as a monorepo for maximum modularity:

- `/packages/compiler`: The "Brain" - Babel plugins for closure extraction and scope analysis.
- `/packages/runtime`: The "Heart" - A tiny (<2KB) loader that manages event interception and resumption.
- `/packages/core`: The "Connector" - Official Vite plugin for a seamless dev experience.
- `/playground`: A live environment to test features and see "Zero-JS" in action.

---

## 🚀 Getting Started

Bosejs is designed to be installed as a standard npm package.

### 1. Create a new project (Recommended)

You can scaffold a new Bose app instantly using our CLI:

```bash
npx create-bose my-cool-app
cd my-cool-app
npm install
npm run dev
```

### 2. Manual Installation

If you want to add Bose to an existing project:

```bash
npm install bose
```

Then, add the plugin to your `vite.config.js`:

```javascript
import bosePlugin from "bose";

export default {
  plugins: [bosePlugin()],
};
```

## 💡 Feature Guides

### 1. Bose Signals (Fine-Grained Reactivity)

Signals are the nervous system of Bose. They allow state to be shared across independent islands without full re-renders.

```javascript
import { useSignal } from "@bose/state";

export default function Counter() {
  // 1. Define a signal (shared globally if ID is provided)
  const count = useSignal(0, "count");

  // 2. Logic is automatically extracted
  const increment = $(() => {
    count.value++;
  });

  return `
        <div>
            <p>Count is: <span bose:bind="count">0</span></p>
            <button bose:on:click="${increment.chunk}">Add</button>
        </div>
    `;
}
```

### 2. Server Actions (Auto-RPC)

Call server-side code without writing `fetch` or defined API routes.

```javascript
export default function AdminPanel() {
  // This function ONLY runs on the server
  const deleteUser = server$(async (id) => {
    const db = await connect();
    return await db.users.delete(id);
  });

  const handleClick = $(async () => {
    const result = await deleteUser(123);
    alert(result.status);
  });

  return `
        <button bose:on:click="${handleClick.chunk}">
            Delete User
        </button>
    `;
}
```

---

## 🗺️ Roadmap

- [x] Resumable Runtime (Loader)
- [x] Closure Extraction Compiler
- [x] Prop Serialization (State Capture)
- [x] Vite Integration
- [x] Server Actions (Auto-RPC)
- [x] Fine-Grained Signals
- [ ] Markdown & Astro-style Frontmatter support
- [ ] File-based Routing

---

## 📄 License

MIT

---

_Built with ❤️ to redefine web performance._
