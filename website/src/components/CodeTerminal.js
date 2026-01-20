export default function CodeTerminal({ command = 'npx create-bose my-app' }) {
    const styles = css$(`
        .terminal {
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 0.75rem;
            width: 100%;
            max-width: 500px;
            margin: 0 auto;
            overflow: hidden;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
            text-align: left;
        }
        .header {
            background: #1e293b;
            padding: 0.75rem 1rem;
            display: flex;
            gap: 0.5rem;
        }
        .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
        }
        .dot-red { background: #ef4444; }
        .dot-yellow { background: #fbbf24; }
        .dot-green { background: #10b981; }
        .body {
            padding: 1.25rem;
            font-family: ui-monospace, monospace;
            font-size: 0.9rem;
            color: #94a3b8;
        }
        .prompt {
            color: #6366f1;
            margin-right: 0.5rem;
            user-select: none;
        }
        .text {
            color: #f8fafc;
        }
        .cursor {
            display: inline-block;
            width: 8px;
            height: 1.2em;
            background: #6366f1;
            margin-left: 2px;
            vertical-align: middle;
            animation: blink 1s step-end infinite;
        }
        @keyframes blink {
            50% { opacity: 0; }
        }
    `);

    return `
        <div class="${styles.terminal}">
            <div class="${styles.header}">
                <div class="${styles.dot} ${styles['dot-red']}"></div>
                <div class="${styles.dot} ${styles['dot-yellow']}"></div>
                <div class="${styles.dot} ${styles['dot-green']}"></div>
            </div>
            <div class="${styles.body}">
                <div>
                    <span class="${styles.prompt}">$</span>
                    <span class="${styles.text}">${command}</span>
                    <span class="${styles.cursor}"></span>
                </div>
            </div>
        </div>
    `;
}
