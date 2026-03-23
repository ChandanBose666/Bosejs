export default function ServerDemoPage() {
    const styles = css$(`
        .page {
            max-width: 680px;
            margin: 4rem auto;
            padding: 2rem;
            font-family: system-ui, sans-serif;
        }
        .card {
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 0.75rem;
            padding: 2rem;
            margin-top: 2rem;
        }
        .label {
            font-size: 0.85rem;
            color: #94a3b8;
            margin-bottom: 0.5rem;
        }
        .input {
            width: 100%;
            background: #020617;
            border: 1px solid #334155;
            border-radius: 0.5rem;
            padding: 0.75rem 1rem;
            color: #f8fafc;
            font-size: 1rem;
            box-sizing: border-box;
        }
        .hint {
            font-size: 0.8rem;
            color: #475569;
            margin-top: 0.5rem;
        }
        .result {
            margin-top: 1.5rem;
            padding: 1rem;
            background: #020617;
            border-radius: 0.5rem;
            border: 1px solid #1e293b;
            font-family: ui-monospace, monospace;
            font-size: 0.85rem;
            color: #22d3ee;
            min-height: 2.5rem;
        }
        .badge {
            display: inline-block;
            background: #6366f1;
            color: white;
            font-size: 0.7rem;
            padding: 0.2rem 0.5rem;
            border-radius: 9999px;
            margin-left: 0.5rem;
            vertical-align: middle;
        }
    `);

    // server$() — the function body runs only on the server.
    // The compiler strips it from the browser bundle and replaces it
    // with a fetch() call to /_bose_action.
    const processData = server$((input) => {
        const upper = input.toUpperCase();
        const wordCount = input.trim().split(/\s+/).filter(Boolean).length;
        return {
            original: input,
            processed: upper,
            wordCount,
            processedAt: new Date().toISOString(),
            serverNote: 'Executed on the server — never shipped to browser'
        };
    });

    const handleKeyup = $(async (event) => {
        if (event.key !== 'Enter') return;
        const input = event.target.value.trim();
        if (!input) return;

        const resultEl = document.getElementById('rpc-result');
        resultEl.textContent = 'Calling server...';

        const data = await processData(input);
        resultEl.textContent = JSON.stringify(data, null, 2);
    });

    return `
        <div class="${styles.page}">
            <h1>server\$() Demo <span class="${styles.badge}">RPC</span></h1>
            <p style="color:#94a3b8">
                Type something below and press <kbd>Enter</kbd>. The function runs
                on the server — open the terminal to see the Node.js logs.
            </p>

            <div class="${styles.card}">
                <div class="${styles.label}">Input</div>
                <input
                    class="${styles.input}"
                    type="text"
                    placeholder="Type something and press Enter..."
                    bose:on:keyup="${handleKeyup.chunk}"
                />
                <div class="${styles.hint}">Triggers server\$() via POST /_bose_action</div>

                <div class="${styles.label}" style="margin-top:1.5rem">Server Response</div>
                <pre class="${styles.result}" id="rpc-result">— waiting —</pre>
            </div>

            <p style="margin-top:2rem"><a href="/">← Home</a></p>
        </div>
    `;
}
