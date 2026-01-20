const babel = require('@babel/core');
const optimizer = require('./optimizer');
const path = require('path');

const code = `
export default function Counter() {
    const count = useSignal(0);
    const step = 5;

    // This part uses 'count' and 'step' from outside
    const increment = $(() => {
        console.log("Adding step:", step);
        return { count: count + step };
    });

    return (
        <button onClick={increment}>Add</button>
    );
}
`;

console.log('--- ORIGINAL CODE ---');
console.log(code);

const output = babel.transformSync(code, {
    plugins: [
        ['@babel/plugin-syntax-jsx'],
        [optimizer, { outputDir: path.join(__dirname, '../../playground/dist') }]
    ]
});

console.log('\n--- COMPILED CODE ---');
console.log(output.code);
console.log('\nCheck playground/dist for the extracted chunk!');
