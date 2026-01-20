import { marked } from 'marked';
import Layout from '../../components/Layout.js';

export default function InstallationPage() {
    const styles = css$(`
        .docs-container {
            padding: 6rem 0;
            display: grid;
            grid-template-columns: 250px 1fr;
            gap: 4rem;
        }
        .sidebar {
            border-right: 1px solid #1e293b;
            padding-right: 2rem;
        }
        .sidebar-h4 {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #475569;
            margin-bottom: 1.5rem;
        }
        .sidebar-link {
            display: block;
            padding: 0.5rem 0;
            color: #94a3b8;
            font-size: 0.9rem;
            transition: color 0.2s;
        }
        .sidebar-link.active {
            color: #818cf8;
            font-weight: 600;
        }
        .sidebar-link:hover {
            color: #f8fafc;
        }
        .content h1 {
            font-size: 3rem;
            font-weight: 800;
            letter-spacing: -0.02em;
            margin-bottom: 2rem;
        }
        .content h2 {
            font-size: 1.75rem;
            font-weight: 700;
            margin: 3rem 0 1.5rem;
            color: #f8fafc;
        }
    `);

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

    const mainContent = `
        <div class="container ${styles['docs-container']}">
            <aside class="${styles.sidebar}">
                <h4 class="${styles['sidebar-h4']}">Get Started</h4>
                <a href="/docs/installation" class="${styles['sidebar-link']} ${styles.active}">Installation</a>
                <a href="#" class="${styles['sidebar-link']}">Project Structure</a>
                <a href="#" class="${styles['sidebar-link']}">Configuration</a>

                <h4 class="${styles['sidebar-h4']}" style="margin-top: 3rem">Core Concepts</h4>
                <a href="#" class="${styles['sidebar-link']}">Signals</a>
                <a href="#" class="${styles['sidebar-link']}">Resumability</a>
                <a href="#" class="${styles['sidebar-link']}">Islands</a>

                <h4 class="${styles['sidebar-h4']}" style="margin-top: 3rem">The Melt</h4>
                <a href="#" class="${styles['sidebar-link']}">Routing</a>
                <a href="#" class="${styles['sidebar-link']}">CSS scoping</a>
            </aside>

            <article class="${styles.content}">
                ${marked(markdownContent)}
            </article>
        </div>
    `;

    return Layout({ 
        children: mainContent, 
        title: 'Installation Guide | Bosejs' 
    });
}
