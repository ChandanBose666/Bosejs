import Layout from './Layout.js';

export default function DocsLayout({ title, children, activePath }) {
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
            position: sticky;
            top: 6rem;
            height: calc(100vh - 6rem);
            overflow-y: auto;
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
        .content h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 2rem 0 1rem;
            color: #e2e8f0;
        }
        .content p {
            color: #cbd5e1;
            line-height: 1.8;
            margin-bottom: 1.5rem;
        }
        .content code {
            background: #1e293b;
            padding: 0.2rem 0.4rem;
            border-radius: 0.25rem;
            font-size: 0.9em;
            color: #e2e8f0;
        }
        .content pre {
            background: #0f172a;
            padding: 1.5rem;
            border-radius: 0.75rem;
            overflow-x: auto;
            margin-bottom: 2rem;
            border: 1px solid #1e293b;
        }
        .content ul {
            padding-left: 1.5rem;
            margin-bottom: 1.5rem;
            color: #cbd5e1;
        }
        .content li {
            margin-bottom: 0.5rem;
        }
    `);

    // Sidebar Navigation Structure
    const links = [
        {
            heading: 'Get Started',
            items: [
                { label: 'Installation', href: '/docs/installation' },
                { label: 'Project Structure', href: '/docs/project-structure' },
                { label: 'Configuration', href: '/docs/configuration' }
            ]
        },
        {
            heading: 'Core Concepts',
            items: [
                { label: 'Signals', href: '/docs/signals' },
                { label: 'Resumability', href: '/docs/resumability' },
                { label: 'Islands', href: '/docs/islands' }
            ]
        },
        {
            heading: 'The Melt',
            items: [
                { label: 'Routing', href: '/docs/routing' },
                { label: 'CSS Scoping', href: '/docs/css-scoping' }
            ]
        }
    ];

    const sidebarContent = links.map(section => `
        <h4 class="${styles['sidebar-h4']}" style="margin-top: ${section.heading === 'Get Started' ? '0' : '3rem'}">
            ${section.heading}
        </h4>
        ${section.items.map(link => `
            <a href="${link.href}" 
               class="${styles['sidebar-link']} ${activePath === link.href ? styles.active : ''}">
                ${link.label}
            </a>
        `).join('')}
    `).join('');

    const mainContent = `
        <div class="container ${styles['docs-container']}">
            <aside class="${styles.sidebar}">
                ${sidebarContent}
            </aside>
            <article class="${styles.content}">
                ${children}
            </article>
        </div>
    `;

    return Layout({ 
        children: mainContent, 
        title: title 
    });
}
