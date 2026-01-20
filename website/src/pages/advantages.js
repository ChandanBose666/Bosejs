export default function Advantages() {
    const styles = css$(`
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            padding: 4rem 2rem;
        }
        .feature-box {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            padding: 2.5rem;
            border-radius: 1rem;
            transition: all 0.3s;
        }
        .feature-box:hover {
            border-color: #6366f1;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
            transform: translateY(-5px);
        }
        .icon {
            font-size: 2rem;
            margin-bottom: 1rem;
        }
        .h3 {
            font-size: 1.5rem;
            margin-bottom: 0.75rem;
            color: #1e293b;
        }
        .p {
            color: #64748b;
            line-height: 1.7;
        }
    `);

    return `
        <section class="${styles.grid}">
            <div class="${styles.feature-box}">
                <div class="${styles.icon}">🚀</div>
                <h3 class="${styles.h3}">Instant Boot</h3>
                <p class="${styles.p}">Bosejs starts in "Resumable" mode. No hydration means your page is interactive from the first millisecond.</p>
            </div>
            <div class="${styles.feature-box}">
                <div class="${styles.icon}">📦</div>
                <h3 class="${styles.h3}">Automatic Shredding</h3>
                <p class="${styles.p}">Our compiler "shreds" your code into granular, lazy-loadable chunks. You never ship more JS than needed.</p>
            </div>
            <div class="${styles.feature-box}">
                <div class="${styles.icon}">📡</div>
                <h3 class="${styles.h3}">Zero-Fetch RPC</h3>
                <p class="${styles.p}">Call server logic with <code>server$()</code>. No REST APIs, no Axios, just seamless function calls.</p>
            </div>
            <div class="${styles.feature-box}">
                <div class="${styles.icon}">🧬</div>
                <h3 class="${styles.h3}">Fine-Grained Signals</h3>
                <p class="${styles.p}">Update exactly what needs to change. No virtual DOM overhead, just native DOM speed.</p>
            </div>
        </section>
    `;
}
