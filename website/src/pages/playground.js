import { useSignal } from '@bose/state';
import Layout from '../components/Layout.js';

export default function Playground() {
    const count = useSignal(0, 'playground-count');
    const color = useSignal('#6366f1', 'playground-color');

    const styles = css$(`
        .playground-section {
            padding: 8rem 0;
            text-align: center;
        }
        .header {
            margin-bottom: 4rem;
        }
        .h1 {
            font-size: 3.5rem;
            font-weight: 800;
            letter-spacing: -0.02em;
            margin-bottom: 1rem;
        }
        .desc {
            color: #94a3b8;
            font-size: 1.125rem;
            max-width: 600px;
            margin: 0 auto;
        }
        .card {
            background: rgba(15, 23, 42, 0.5);
            padding: 4rem;
            border-radius: 2rem;
            border: 1px solid #1e293b;
            max-width: 600px;
            margin: 0 auto;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .display {
            font-size: 8rem;
            font-weight: 900;
            margin: 2rem 0;
            transition: color 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            letter-spacing: -0.05em;
        }
        .controls {
            display: flex;
            gap: 1.5rem;
            justify-content: center;
            margin-top: 3rem;
        }
        .btn {
            padding: 1rem 2rem;
            border-radius: 0.75rem;
            border: 1px solid #334155;
            background: rgba(30, 41, 59, 0.5);
            color: #f8fafc;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn:hover {
            background: rgba(30, 41, 59, 1);
            transform: translateY(-2px);
            border-color: #475569;
        }
        .btn-primary {
            background: #6366f1;
            border-color: transparent;
        }
        .btn-primary:hover {
            background: #4f46e5;
            box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);
        }
    `);

    const handleIncrement = $(() => {
        count.value++;
    });

    const handleColorChange = $(() => {
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#22d3ee'];
        color.value = colors[Math.floor(Math.random() * colors.length)];
    });

    const content = `
        <div class="container ${styles['playground-section']}">
            <header class="${styles.header}">
                <h1 class="${styles.h1}">Interactive Playground</h1>
                <p class="${styles.desc}">
                    Experience partial resumption in real-time. 
                    Initially <strong>0KB JS</strong> — code only loads when you click.
                </p>
            </header>
            
            <div class="${styles.card}">
                <div class="${styles.display}" bose:bind="playground-count" style="color: \${color.value}">0</div>
                
                <div class="${styles.controls}">
                    <button class="${styles.btn} ${styles['btn-primary']}" bose:on:click="\${handleIncrement.chunk}">
                        Increment Count
                    </button>
                    <button class="${styles.btn}" bose:on:click="\${handleColorChange.chunk}">
                        Change Theme
                    </button>
                </div>
            </div>
        </div>
    `;

    return Layout({ 
        children: content,
        title: 'Bosejs Playground | Interactive Resumability'
    });
}
