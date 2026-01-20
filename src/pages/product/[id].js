export default function ProductPage({ params }) {
    const { id } = params;

    // Simulate a server-side DB call
    const logger = server$((msg) => {
        console.log("[Server DB] Fetching data for ID:", id);
        return { name: `Product #${id}`, price: `$${Math.floor(Math.random() * 100)}` };
    });

    return `
        <div style="padding: 2rem; border: 1px solid #ccc; border-radius: 8px;">
            <h1>Dynamic Product Page</h1>
            <p>ID: <b>${id}</b></p>
            <p>Status: Successfully rendered via file-based routing!</p>
            
            <button bose:on:click="${$(async () => {
                const data = await logger("Ping from Client");
                alert(`Fetched from Server: ${data.data}`);
            })}">
                Fetch Server Data
            </button>
            <br><br>
            <a href="/">Back Home</a>
        </div>
    `;
}
