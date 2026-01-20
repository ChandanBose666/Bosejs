export default function Hero() {
    const styles = css$(`
        .hero {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            background: radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%);
            color: white;
            padding: 4rem 2rem;
            text-align: center;
            border-bottom: 1px solid #1e293b;
            gap: 1.5rem;
        }
        .title {
            font-size: 5rem;
            font-weight: 800;
            letter-spacing: -0.05em;
            background: linear-gradient(to bottom right, #818cf8, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0;
        }
        .subtitle {
            font-size: 1.5rem;
            color: #94a3b8;
            max-width: 600px;
        }
        .cta {
            background: #6366f1;
            color: white;
            padding: 1rem 2.5rem;
            border-radius: 9999px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s;
            border: 2px solid transparent;
        }
        .cta:hover {
            background: #4f46e5;
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
        }
    `);

    return `
        <header class="${styles.hero}">
            <h1 class="${styles.title}">BOSEJS</h1>
            <p class="${styles.subtitle}">The All-Powerful Resumable Framework for the Modern Web.</p>
            <div style="margin-top: 2rem;">
                <a href="/docs/installation" class="${styles.cta}">Start Building →</a>
            </div>
        </header>
    `;
}
