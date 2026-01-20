import { marked } from 'marked';
import DocsLayout from '../../components/DocsLayout.js';

export default function InstallationPage() {
    const markdownContent = `
# Installation

Bosejs is designed to be zero-config and lightning fast. You can start a new project in seconds.

## 1. Quick Start (Recommended)
The easiest way to get started is with our automated CLI:

\`\`\`bash
npx create-bose my-app
\`\`\`

## 2. Manual Setup
If you prefer to integrate Bosejs into an existing project, install the core packages:

\`\`\`bash
npm install bose @bose/state
\`\`\`

## 3. Configuration
Add the Bose plugin to your \`vite.config.js\`:

\`\`\`javascript
import { defineConfig } from 'vite';
import bosePlugin from 'bose';

export default defineConfig({
  plugins: [bosePlugin()]
});
\`\`\`

## 4. Next Steps
Now that you have Bosejs installed, check out how to build your first [Bose Island](/playground).
    `;

    return DocsLayout({ 
        title: 'Installation Guide | Bosejs',
        activePath: '/docs/installation',
        children: marked(markdownContent)
    });
}
