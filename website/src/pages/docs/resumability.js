import { marked } from 'marked';
import DocsLayout from '../../components/DocsLayout.js';

export default function ResumabilityPage() {
    const markdownContent = `
# Resumability

Resumability is the core innovation of Bosejs. It allows applications to resume execution on the client exactly where the server left off, **without re-executing the component tree** (Hydration).

## How it Works

1. **Serialization**: During Server-Side Rendering (SSR), Bosejs captures the state of your application and serializes it into the HTML (via \`bose:state\` attributes).
2. **Chunk Generation**: The Optimizer extracts your event handlers into tiny, separate JavaScript files ("chunks").
3. **Resumption**: The browser loads **0KB of JavaScript** initially.
4. **Interactive Lazy-Loading**: When a user clicks a button, the global runtime intercepts the event, downloads *only* the specific chunk needed for that handler, and executes it with the restored state.

## The $( ) Optimizer

The key to this is the \`$\` function. It tells the compiler "split this code here".

\`\`\`javascript
// This function is extracted to a separate file!
const handleClick = $(() => {
    alert("I was lazy loaded!");
});

return \`<button bose:on:click="\${handleClick.chunk}">Click Me</button>\`;
\`\`\`

## Why is it better than Hydration?

Standard hydration requires downloading and executing the JavaScript for *all* components on the page just to make one button clickable. Bosejs only downloads code when the user actually interacts with it. This results in **Instant Interactive** scores and near-zero TTI (Time to Interactive).
    `;

    return DocsLayout({ 
        title: 'Resumability | Bosejs',
        activePath: '/docs/resumability',
        children: marked(markdownContent)
    });
}
