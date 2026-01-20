export default function ServerApp() {
    // This function will be automatically transformed into an RPC call
    const saveToDB = server$((data) => {
        console.log("Saving to DB on the Server:", data);
        return { status: "success", id: 123 };
    });

    const handleInput = $(async (event) => {
        const value = event.target.value;
        if (event.key === 'Enter') {
            console.log("Triggering Server Action...");
            const result = await saveToDB(value);
            alert(`Server Response: ${result.data}`);
        }
    });

    return `
        <div class="server-island">
            <h3>Server Actions Demo</h3>
            <p>Type something and press Enter to save to "DB".</p>
            <input type="text" bose:on:keyup="${handleInput.chunk}" placeholder="Enter data...">
        </div>
    `;
}
