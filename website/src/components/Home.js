import Hero from './Hero.js';

export default function Home() {
    const styles = css$(`
        .features {
            padding: 8rem 0;
            background: #020617;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 3rem;
        }
        .card {
            background: rgba(15, 23, 42, 0.4);
            border: 1px solid #1e293b;
            padding: 3.5rem;
            border-radius: 2rem;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
        }
        .card:hover {
            transform: translateY(-8px);
            border-color: #6366f1;
            background: rgba(15, 23, 42, 0.7);
        }
        .icon {
            font-size: 3rem;
            margin-bottom: 2rem;
            background: rgba(99, 102, 241, 0.1);
            padding: 1.25rem;
            border-radius: 1.25rem;
            display: inline-block;
        }
        .h3 {
            font-size: 1.75rem;
            font-weight: 800;
            margin-bottom: 1.25rem;
            color: #f8fafc;
        }
        .p {
            color: #94a3b8;
            line-height: 1.8;
            font-size: 1.1rem;
        }
        .mention {
            color: #818cf8;
            font-weight: 700;
        }
    `);

    return `
        ${Hero()}

        <section class="${styles.features}">
            <div class="container">
                <div class="${styles.grid}">
                    <div class="${styles.card}">
                        <div class="${styles.icon}">🚀</div>
                        <h3 class="${styles.h3}">Zero Initial Bundle</h3>
                        <p class="${styles.p}">
                            Pages start with <span class="${styles.mention}">0KB of framework JavaScript</span>. 
                            Bosejs only downloads what it needs, when it needs it.
                        </p>
                    </div>
                    
                    <div class="${styles.card}">
                        <div class="${styles.icon}">🧊</div>
                        <h3 class="${styles.h3}">Pure Resumability</h3>
                        <p class="${styles.p}">
                            Forget hydration. Bosejs <span class="${styles.mention}">resumes</span> 
                            work on the client instantly.
                        </p>
                    </div>

                    <div class="${styles.card}">
                        <div class="${styles.icon}">⚡</div>
                        <h3 class="${styles.h3}">Surgical Signals</h3>
                        <p class="${styles.p}">
                            Updates are fine-grained and direct. No virtual DOM, just <span class="${styles.mention}">raw performance</span>.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    `;
}
