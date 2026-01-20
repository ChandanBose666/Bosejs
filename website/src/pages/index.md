---
title: Bosejs | The All-Powerful Resumable Framework
---

<div id="hero-container"></div>

<script type="module">
    import { css$ } from 'bose';
    
    // We'll use a component for the Hero to leverage css$
</script>

# Why Bosejs?

Bosejs isn't just another framework; it's a paradigm shift.

### 🚀 Resumability vs Hydration

Hydration is like downloading a car, then assembling it in your driveway before you can drive. **Resumability** is like hopping into a car that's already running. Bosejs serializes the "engine state" directly into the HTML.

### ⚡ 0KB JS Initial Load

Your site starts with ZERO framework JavaScript. The sub-2KB loader only wakes up when the user interacts with an island.

### 🧬 Fine-Grained Signals

State updates are surgical. Instead of re-rendering whole components, Bosejs updates the exact DOM nodes that need to change.

---

## Ready to start?

```bash
npx create-bose my-app
```

[Read the Docs](/docs/installation) | [Try the Playground](/playground)
