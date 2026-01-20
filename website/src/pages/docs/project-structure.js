import { marked } from 'marked';
import DocsLayout from '../../components/DocsLayout.js';

export default function ProjectStructurePage() {
    const markdownContent = `
# Project Structure

A typical Bosejs project has the following file structure. Understanding this helps you navigate and scale your application.

## Root Directory

\`\`\`bash
my-app/
├── src/
│   ├── components/   # Reusable UI components
│   └── pages/        # File-based routing
├── public/           # Static assets
└── vite.config.js    # Configuration
\`\`\`

## Key Files

- **src/pages/**: Every file here becomes a route.
- **src/components/**: Logic-free or interactive components.
- **vite.config.js**: The brain of your build process.
    `;

    return DocsLayout({ 
        title: 'Project Structure | Bosejs',
        activePath: '/docs/project-structure',
        children: marked(markdownContent)
    });
}
