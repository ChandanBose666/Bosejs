import { marked } from 'marked';
import DocsLayout from '../../components/DocsLayout.js';

export default function IslandsPage() {
    const markdownContent = `
# Islands

In Bosejs, every interactive element is effectively an "Island". However, unlike other frameworks where you must explicitly define island boundaries, Bosejs islands are **implicit** and **granular**.

## Granular Interactivity

Because the optimizer splits code at the function level (\`$(...)\`), an island in Bosejs isn't a whole component—it's just the event handler itself.

\`\`\`javascript
export default function MyComponent() {
    // This part runs ONLY on the server
    const heavyCalculations = doMath(); 

    // This tiny function is the ONLY thing sent to the browser
    const handleClick = $(() => {
        console.log("Interactive bit");
    });

    return \`
        <div>
            <h1>Static Content</h1>
            <button bose:on:click="\${handleClick.chunk}">
                Interactive Island
            </button>
        </div>
    \`;
}
\`\`\`

## No "Client Load"

You never need to manually specify \`client:load\` or \`client:visible\`. The Bose runtime handles the loading strategy automatically (Interaction-based loading).
    `;

    return DocsLayout({ 
        title: 'Islands | Bosejs',
        activePath: '/docs/islands',
        children: marked(markdownContent)
    });
}
