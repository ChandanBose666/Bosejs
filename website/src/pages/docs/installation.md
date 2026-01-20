---
title: Installation Guide
---

# Getting Started with Bosejs

Bosejs is designed to be zero-config and lightning fast.

## 1. Scaffold a New Project

The fastest way to get started is with our CLI:

```bash
npx create-bose my-app
```

## 2. Manual Installation

If you prefer to set up manually, install the core packages:

```bash
npm install bose @bose/state
```

## 3. Configure Vite

Add the Bose plugin to your `vite.config.js`:

```javascript
import { defineConfig } from "vite";
import bosePlugin from "bose";

export default defineConfig({
  plugins: [bosePlugin()],
});
```

## 4. Your First Component

Create `src/pages/index.js`:

```javascript
export default function Home() {
  return `<h1>Hello Bose!</h1>`;
}
```

[Back to Home](/)
