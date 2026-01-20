import { marked } from 'marked';
import DocsLayout from '../../components/DocsLayout.js';

export default function RoutingPage() {
    const markdownContent = `
# File-based Routing

Bosejs includes a built-in file-based router inspired by Next.js and Astro. Any file in the \`src/pages\` directory immediately becomes a route in your application.

## Basic Routes

- \`src/pages/index.js\` → \`/\`
- \`src/pages/about.js\` → \`/_about\`
- \`src/pages/contact.md\` → \`/contact\` (Markdown pages work too!)

## Dynamic Routes

Bosejs supports dynamic route parameters using brackets \`[param]\`:

- \`src/pages/product/[id].js\` → \`/product/123\`

To access parameters:

\`\`\`javascript
export default function ProductPage({ params }) {
    return \`<h1>Product ID: \${params.id}</h1>\`;
}
\`\`\`

## Markdown Pages

You can create content-heavy pages using \`.md\` files. Bosejs automatically compiles them and wraps them in your layout if configured.

**src/pages/guide.md**
\`\`\`markdown
---
title: My Guide
---
# Hello World
This is a markdown page.
\`\`\`
    `;

    return DocsLayout({ 
        title: 'Routing | Bosejs',
        activePath: '/docs/routing',
        children: marked(markdownContent)
    });
}
