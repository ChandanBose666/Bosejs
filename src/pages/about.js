export default function AboutPage() {
    const styles = css$(`
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            font-family: system-ui, sans-serif;
            background: #f8fafc;
            border-radius: 1rem;
        }
        .heading {
            color: #1e293b;
            font-size: 2.5rem;
        }
        .text {
            line-height: 1.6;
            color: #475569;
        }
    `);

    return `
        <div class="${styles.container}">
            <h1 class="${styles.heading}">About Bosejs</h1>
            <p class="${styles.text}">
                Bosejs is the world's first "Hyper-Framework." By merging the 
                <b>Islands Architecture</b> with <b>Fine-Grained Resumability</b>, 
                we ensure that your users get the fastest experience possible.
            </p>
            <a href="/">Back Home</a>
        </div>
    `;
}
