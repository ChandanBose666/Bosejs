---
title: Welcome to Bosejs
---

# 🚀 The Bosejs Experience

This page is rendered directly from a **Markdown** file in `src/pages/index.md`.

## Features

- **0-JS by default**: This paragraph ships no JavaScript.
- **Markdown Components**: Use HTML and Bose islands together.

<div class="island" style="border: 2px solid #6366f1; padding: 2rem; border-radius: 1rem; margin: 2rem 0;">
  <h3>Bose Resumability inside Markdown</h3>
  <p>The button below is "shredded" and lazy-loaded only when you click it.</p>
  
  <button bose:on:click="${$(() => alert('Hello from the Markdown Island!'))}">
    Click to Resume
  </button>
</div>

[About Bose](/about) | [View Product 1](/product/1)
