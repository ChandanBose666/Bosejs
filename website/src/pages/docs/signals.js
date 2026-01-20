import { marked } from 'marked';
import DocsLayout from '../../components/DocsLayout.js';

export default function SignalsPage() {
    const markdownContent = `
# Signals

Signals are the nervous system of Bosejs. They provide fine-grained reactivity, allowing state to be shared across independent Resumable Islands without requiring a full App re-render.

## useSignal

The \`useSignal\` hook creates a reactive value. When used inside a serialized function (like \`$()\`), it retains its connection to the UI elements that depend on it.

\`\`\`javascript
import { useSignal } from '@bose/state';

// 1. Create a signal
// If you provide an ID ('count'), it becomes a global shared signal
const count = useSignal(0, 'count');

// 2. Read value
console.log(count.value);

// 3. Update value
count.value++;
\`\`\`

## Binding to DOM

Bosejs offers zero-JS bindings. The runtime automatically updates these elements when the signal changes.

### Text Binding (\`bose:bind\`)
Updates the \`innerText\` of an element.

\`\`\`html
<span bose:bind="count">0</span>
\`\`\`

### Style Binding (\`bose:bind:style\`)
Updates specific CSS properties.

\`\`\`html
<!-- Updates style.color when 'themeColor' signal changes -->
<div bose:bind:style="color:themeColor">I change color!</div>
\`\`\`

## Global Synchronization

Because Bosejs is resumable, signals are synchronized globally. If you have two buttons using the same signal ID, updating one will automatically update the other, even if they are in different interactive chunks.
    `;

    return DocsLayout({ 
        title: 'Signals | Bosejs',
        activePath: '/docs/signals',
        children: marked(markdownContent)
    });
}
