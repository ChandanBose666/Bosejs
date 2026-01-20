export default function Layout({ children, title = 'Bosejs' }) {
    const styles = css$(`
        .bose-layout {
            min-height: 100vh;
            background: #020617;
            color: #f8fafc;
        }
        .bose-nav {
            position: sticky;
            top: 0;
            z-index: 50;
            backdrop-filter: blur(12px);
            background: rgba(2, 6, 23, 0.7);
            border-bottom: 1px solid #1e293b;
            height: 4rem;
            display: flex;
            align-items: center;
        }
        .nav-inner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }
        .bose-logo {
            font-size: 1.25rem;
            font-weight: 800;
            background: linear-gradient(to right, #818cf8, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .bose-links {
            display: flex;
            gap: 2rem;
        }
    `);

    return `
        <div class="${styles['bose-layout']}">
            <nav class="${styles['bose-nav']}">
                <div class="container ${styles['nav-inner']}">
                    <a href="/" class="${styles['bose-logo']}">BOSEJS</a>
                    <div class="${styles['bose-links']}">
                        <a href="/docs/installation">Docs</a>
                        <a href="/playground">Playground</a>
                    </div>
                </div>
            </nav>
            <main>
                ${children}
            </main>
        </div>
    `;
}
