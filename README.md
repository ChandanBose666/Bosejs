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

## 📦 Packages

Bosejs is published as a monorepo. As a **user you only install two packages** — the rest are internal dependencies pulled in automatically.

| Package | Install? | Role |
|---|---|---|
| `@bosejs/core` | ✅ Yes | Vite plugin — file-based routing, SSR, dev server |
| `@bosejs/state` | ✅ Yes | Fine-grained reactive signals (`useSignal`) |
| `@bosejs/compiler` | 🔧 Auto | Babel plugin — extracts `$()` closures into lazy chunks |
| `@bosejs/runtime` | 🔧 Auto | Tiny (<2KB) browser loader — resumes event handlers |

When you install `@bosejs/core`, npm automatically installs `@bosejs/compiler` and `@bosejs/runtime` as transitive dependencies. You never need to touch them directly.

`@bosejs/state` is listed separately because you import from it directly in your page files (`import { useSignal } from '@bosejs/state'`), so it needs to be an explicit dependency in your project.

---

## 🛠️ Monorepo Structure

```
packages/
  core/        ← @bosejs/core    (Vite plugin)
  compiler/    ← @bosejs/compiler (Babel plugin, auto-installed)
  runtime/     ← @bosejs/runtime  (Browser loader, auto-installed)
  state/       ← @bosejs/state   (Signals)
  create-bose/ ← create-bose     (Project scaffold CLI)
playground/    ← local dev sandbox
```

---

## 🚀 Getting Started

### 1. Create a new project (Recommended)

```bash
npx create-bose my-cool-app
cd my-cool-app
npm install
npm run dev
```

Then open `http://localhost:5173`.

### 2. Manual Installation

If you want to add Bosejs to an existing Vite project:

```bash
npm install @bosejs/core @bosejs/state
```

Add the plugin to your `vite.config.js`:

```javascript
import { defineConfig } from "vite";
import bosePlugin from "@bosejs/core";

export default defineConfig({
  plugins: [bosePlugin()],
});
```

## 💡 Feature Guides

### 1. Bose Signals (Fine-Grained Reactivity)

Signals are the nervous system of Bose. They allow state to be shared across independent islands without full re-renders.

```javascript
import { useSignal } from "@bosejs/state";

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

Call server-side code without writing `fetch` or defining API routes.

```javascript
export default function AdminPanel() {
  // This function ONLY runs on the server — never shipped to the browser
  const deleteUser = server$(async (id) => {
    const db = await connect();
    return await db.users.delete(id);
  });

  const handleClick = $(async () => {
    const result = await deleteUser(123);
    console.log(result.status);
  });

  return `
        <button bose:on:click="${handleClick.chunk}">
            Delete User
        </button>
    `;
}
```

### 3. File-based Routing

Bose automatically maps files in `src/pages` to URLs.

- `src/pages/index.md` -> `/`
- `src/pages/about.js` -> `/about`
- `src/pages/product/[id].js` -> `/product/123` (Dynamic parameters available via `params`)

### 4. Scoped CSS-in-JS (`css$( )`)

Keep styles scoped to your island with zero runtime overhead.

```javascript
export default function StyledButton() {
  const styles = css$(`
        .btn { background: blue; color: white; }
    `);
  return `<button class="${styles.btn}">Styled Island</button>`;
}
```

### 5. Markdown Support

Bose treats `.md` files as components. You can use frontmatter for metadata and embed interactive `$( )` islands directly in your prose.

---

## 🗺️ Roadmap

- [x] Resumable Runtime (Loader)
- [x] Closure Extraction Compiler
- [x] Prop Serialization (State Capture)
- [x] Vite Integration
- [x] Server Actions (Auto-RPC)
- [x] Fine-Grained Signals
- [x] File-based Routing
- [x] Markdown Support
- [x] Scoped CSS-in-JS
- [ ] Production Edge Deployment (Bun/Cloudflare)

---

## 📄 License

MIT

---

_Built with ❤️ to redefine web performance._
