import { useSignal } from '@bose/state';

export default function Playground() {
    const count = useSignal(0, 'playground-count');
    const color = useSignal('#6366f1', 'playground-color');

    const styles = css$(`
        .playground {
            padding: 4rem 2rem;
            max-width: 900px;
            margin: 0 auto;
            font-family: Inter, sans-serif;
        }
        .card {
            background: white;
            padding: 3rem;
            border-radius: 1.5rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
            text-align: center;
            border: 1px solid #e2e8f0;
        }
        .display {
            font-size: 4rem;
            font-weight: 800;
            margin: 2rem 0;
            transition: color 0.3s;
        }
        .controls {
            display: flex;
            gap: 1rem;
            justify-content: center;
        }
        .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            border: none;
            background: #f1f5f9;
            color: #475569;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn:hover {
            background: #e2e8f0;
            transform: scale(1.05);
        }
        .btn-primary {
            background: #6366f1;
            color: white;
        }
    `);

    const handleIncrement = $(() => {
        count.value++;
    });

    const handleColorChange = $(() => {
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        color.value = colors[Math.floor(Math.random() * colors.length)];
    });

    return `
        <div class="${styles.playground}">
            <h1>Interactive Playground</h1>
            <p>This entire page ships 0KB JS initially. Only the click handlers below are loaded on-demand.</p>
            
            <div class="${styles.card}">
                <div class="${styles.display}" bose:bind="playground-count" style="color: \${color.value}">0</div>
                
                <div class="${styles.controls}">
                    <button class="${styles.btn} ${styles.btn-primary}" bose:on:click="${handleIncrement.chunk}">
                        Increment Count
                    </button>
                    <button class="${styles.btn}" bose:on:click="${handleColorChange.chunk}">
                        Change Theme Color
                    </button>
                </div>
            </div>
            
            <br><br>
            <a href="/">Back Home</a>
        </div>
    `;
}
