/**
 * TEST COMPONENT
 * This file will be automatically transformed by the Bose Vite Plugin.
 */
export default function InteractiveApp() {
    const greeting = "Hello from Bose!";
    
    // The $() will be replaced by a chunk reference
    const handleClick = $(() => {
        alert(greeting);
    });

    return `
        <div class="app">
            <h1>Dynamic Bose App</h1>
            <button bose:on:click="${handleClick.chunk}" bose:state='{"greeting": "${greeting}"}'>
                Click Me (Automatic Shredding)
            </button>
        </div>
    `;
}
