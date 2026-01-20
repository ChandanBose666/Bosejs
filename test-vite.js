const bosePlugin = require('./packages/core/vite-plugin');
const fs = require('fs');
const path = require('path');

const plugin = bosePlugin({ outputDir: 'playground/public/chunks' });

const testFile = path.resolve(__dirname, 'playground/server-app.js');
const code = fs.readFileSync(testFile, 'utf-8');

console.log('--- Testing Bose Vite Plugin ---');
const result = plugin.transform(code, testFile);

if (result) {
    console.log('\n--- Transformed Code ---');
    console.log(result.code);
    console.log('\nSuccess! Check playground/public/chunks for the generated files.');
} else {
    console.log('Transformation failed.');
}
