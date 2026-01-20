import CodeTerminal from './CodeTerminal.js';

export default function Hero() {
    const styles = css$(`
        .hero {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 10rem 2rem 8rem;
            text-align: center;
            position: relative;
        }
        .badge {
            background: rgba(99, 102, 241, 0.1);
            color: #818cf8;
            padding: 0.6rem 1.25rem;
            border-radius: 9999px;
            font-size: 0.85rem;
            font-weight: 600;
            border: 1px solid rgba(99, 102, 241, 0.2);
            margin-bottom: 2.5rem;
            display: inline-block;
        }
        .title {
            font-size: 7rem;
            font-weight: 900;
            line-height: 0.95;
            letter-spacing: -0.05em;
            margin: 0;
            background: linear-gradient(to bottom, #f8fafc 30%, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            max-width: 1000px;
        }
        .accent {
            background: linear-gradient(to right, #6366f1, #c084fc, #22d3ee);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle {
            font-size: 1.5rem;
            color: #94a3b8;
            max-width: 750px;
            margin: 2.5rem 0 3.5rem;
            line-height: 1.6;
        }
        .cta-group {
            display: flex;
            gap: 1.5rem;
            margin-bottom: 5rem;
        }
        .btn-primary {
            background: #6366f1;
            color: white;
            padding: 1.125rem 2.25rem;
            border-radius: 0.875rem;
            font-weight: 600;
            transition: all 0.2s;
            box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.5);
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            background: #4f46e5;
            box-shadow: 0 15px 30px -5px rgba(99, 102, 241, 0.6);
        }
        .btn-secondary {
            background: rgba(30, 41, 59, 0.5);
            color: #f8fafc;
            padding: 1.125rem 2.25rem;
            border-radius: 0.875rem;
            font-weight: 600;
            border: 1px solid #334155;
            transition: all 0.2s;
        }
        .btn-secondary:hover {
            background: rgba(30, 41, 59, 0.8);
            border-color: #475569;
        }
        @media (max-width: 768px) {
            .title { font-size: 4rem; }
            .subtitle { font-size: 1.25rem; }
            .cta-group { flex-direction: column; width: 100%; }
        }
    `);

    return `
        <section class="${styles.hero}">
            <div class="${styles.badge}">Version 0.1.0 "The Aura" available now</div>
            <h1 class="${styles.title}">
                The All-Powerful <br/>
                <span class="${styles.accent}">Resumable</span> Framework
            </h1>
            <p class="${styles.subtitle}">
                Build lightning-fast websites that ship <strong>zero initial JavaScript</strong>. 
                Experience the magic of partial resumption with Bosejs.
            </p>
            
            <div class="${styles['cta-group']}">
                <a href="/docs/installation" class="${styles['btn-primary']}">Get Started</a>
                <a href="https://github.com/ChandanBose666/Bosejs" class="${styles['btn-secondary']}">View on GitHub</a>
            </div>

            ${CodeTerminal({ command: 'npx create-bose@latest my-app' })}
        </section>
    `;
}
