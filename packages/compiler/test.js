import babel from '@babel/core';
import optimizer from './optimizer.js';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test 1: $() with a signal and a plain variable both appear in state
{
  const code = `
export default function Counter() {
  const count = useSignal(0);
  const step = 5;
  const increment = $(() => {
    console.log("Adding step:", step);
    return { count: count + step };
  });
  return '<button>' + increment.chunk + '</button>';
}
`;

  const output = babel.transformSync(code, {
    plugins: [
      ['@babel/plugin-syntax-jsx'],
      [optimizer, { outputDir: path.join(__dirname, '../../playground/dist') }]
    ],
    filename: 'test-counter.js',
  });

  assert.ok(output.code.includes('state:'), 'descriptor must include state property');
  assert.ok(output.code.includes('JSON.stringify'), 'state must use JSON.stringify');
  assert.ok(output.code.includes('count.value'), 'signal var must serialize as .value');
  assert.ok(output.code.includes('"count"') || output.code.includes("'count'"), 'props must include count');
  console.log('PASS: $() descriptor includes state property with correct variable handling');
}

// Test 2: server$() variables are excluded from state
{
  const code = `
export default function Page() {
  const doAction = server$(async () => ({ ok: true }));
  const handleClick = $(() => { doAction(); });
  return '<button>' + handleClick.chunk + '</button>';
}
`;

  const output = babel.transformSync(code, {
    plugins: [
      ['@babel/plugin-syntax-jsx'],
      [optimizer, { outputDir: path.join(__dirname, '../../playground/dist') }]
    ],
    filename: 'test-server-action.js',
  });

  assert.ok(!output.code.includes('doAction.value') && !output.code.includes('"doAction"'),
    'server action vars must be excluded from state');
  console.log('PASS: server$() variables excluded from state');
}

console.log('\nAll compiler tests passed.');
