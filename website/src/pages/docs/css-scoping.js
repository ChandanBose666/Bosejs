import { marked } from 'marked';
import DocsLayout from '../../components/DocsLayout.js';

export default function CSSScopingPage() {
    const markdownContent = `
# CSS Scoping

Bosejs provides a built-in CSS-in-JS solution that is zero-runtime and fully scoped. It uses the \`css$\` tagged template literal.

## Usage

\`\`\`javascript
export default function Card() {
    // Returns an object with generated class names
    const styles = css$(\`
        .card {
            background: white;
            padding: 1rem;
            border-radius: 8px;
        }
        .title {
            color: #333;
            font-weight: bold;
        }
        .card:hover {
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
    \`);

    return \`
        <div class="\${styles.card}">
            <h2 class="\${styles.title}">Hello World</h2>
        </div>
    \`;
}
\`\`\`

## How it works

1. **Compiler**: During build, Bosejs extracts the CSS from your component.
2. **Hashing**: It generates unique class names (e.g., \`card_hz93k\`) to prevent collisions.
3. **Extraction**: The CSS is extracted into a global stylesheet or injected into the head.
4. **Runtime**: The \`css$\` function returns the hashed class names map, so your runtime code just sees simple strings.
    `;

    return DocsLayout({ 
        title: 'CSS Scoping | Bosejs',
        activePath: '/docs/css-scoping',
        children: marked(markdownContent)
    });
}
