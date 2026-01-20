import Layout from '../components/Layout.js';

export default function Advantages() {
    const styles = css$(`
        .section {
            padding: 8rem 0;
        }
        .header {
            text-align: center;
            margin-bottom: 5rem;
        }
        .h1 {
            font-size: 3.5rem;
            font-weight: 800;
            letter-spacing: -0.02em;
            margin-bottom: 1.5rem;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2.5rem;
        }
        .feature-box {
            background: rgba(15, 23, 42, 0.5);
            border: 1px solid #1e293b;
            padding: 3rem;
            border-radius: 1.5rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
        }
        .feature-box:hover {
            border-color: #6366f1;
            background: rgba(15, 23, 42, 0.8);
            transform: translateY(-8px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
        }
        .icon {
            font-size: 2.5rem;
            margin-bottom: 2rem;
            display: inline-block;
            background: rgba(99, 102, 241, 0.1);
            padding: 1rem;
            border-radius: 1rem;
        }
        .h3 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: #f8fafc;
        }
        .p {
            color: #94a3b8;
            line-height: 1.8;
            margin: 0;
        }
    `);

    const content = `
        <div class="container ${styles.section}">
            <header class="${styles.header}">
                <h1 class="${styles.h1}">Why Bosejs?</h1>
                <p class="${styles.p}">Built for the next generation of fast, interactive web applications.</p>
            </header>
            
            <section class="${styles.grid}">
                <div class="${styles['feature-box']}">
                    <div class="${styles.icon}">🚀</div>
                    <h3 class="${styles.h3}">Instant Resumption</h3>
                    <p class="${styles.p}">Bosejs starts where the server left off. No hydration, no redundant execution, just instant interaction.</p>
                </div>
                <div class="${styles['feature-box']}">
                    <div class="${styles.icon}">📦</div>
                    <h3 class="${styles.h3}">Automatic Shredding</h3>
                    <p class="${styles.p}">Our compiler breaks your code into granular, lazy-loadable chunks. You never ship more JS than needed.</p>
                </div>
                <div class="${styles['feature-box']}">
                    <div class="${styles.icon}">📡</div>
                    <h3 class="${styles.h3}">Zero-Fetch RPC</h3>
                    <p class="${styles.p}">Invoke server functions directly from your components. Bosejs handles the plumbing securely.</p>
                </div>
                <div class="${styles['feature-box']}">
                    <div class="${styles.icon}">🧬</div>
                    <h3 class="${styles.h3}">Fine-Grained Signals</h3>
                    <p class="${styles.p}">Updates are precise and native. No virtual DOM diffing—just lightning-fast direct DOM mutations.</p>
                </div>
            </section>
        </div>
    `;

    return Layout({ 
        children: content,
        title: 'Why Bosejs? | Advantages of Resumability'
    });
}
