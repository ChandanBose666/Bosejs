import { marked } from 'marked';
import DocsLayout from '../../components/DocsLayout.js';

export default function ConfigurationPage() {
    const markdownContent = `
# Configuration

Bosejs uses a standard \`vite.config.js\` file for configuration. The \`bosePlugin\` handles all the framework-specific optimization and build logic.

## Basic Setup

Add the Bose plugin to your Vite configuration:

\`\`\`javascript
// vite.config.js
import { defineConfig } from 'vite';
import bosePlugin from 'bose';

export default defineConfig({
  plugins: [bosePlugin()]
});
\`\`\`

## Plugin Options

The \`bosePlugin\` accepts an optional configuration object:

\`\`\`javascript
bosePlugin({
    // Directory where generated chunks are stored (default: 'playground/public/chunks')
    outputDir: 'dist/chunks',
    
    // Directory for file-based routing (default: 'src/pages')
    pagesDir: 'src/pages',
    
    // Endpoint for server RPC actions (default: '/_bose_action')
    actionEndpoint: '/_bose_action'
})
\`\`\`

## Environment Variables

Bosejs respects standard Vite environment variables.

- \`process.env.DEBUG_BOSE\`: Set this to \`true\` to enable verbose SSR logging in the terminal.
    `;

    return DocsLayout({ 
        title: 'Configuration | Bosejs',
        activePath: '/docs/configuration',
        children: marked(markdownContent)
    });
}
