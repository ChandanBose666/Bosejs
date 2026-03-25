import babel from '@babel/core';
import optimizer from './optimizer.js';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let passed = 0;
let failed = 0;

function compile(code, filename = 'test.js') {
  return babel.transformSync(code, {
    plugins: [
      ['@babel/plugin-syntax-jsx'],
      [optimizer, { outputDir: path.join(__dirname, '../../playground/dist') }],
    ],
    filename,
  });
}

function capturedVars(code) {
  // Extract the JSON.stringify({...}) object keys — these are the captured state vars.
  const match = code.match(/JSON\.stringify\(\{([^}]*)\}\)/);
  if (!match) return [];
  return match[1].split(',').map(s => s.trim().split(':')[0].trim()).filter(Boolean);
}

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (e) {
    console.error(`  FAIL: ${name}`);
    console.error(`        ${e.message}`);
    failed++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Group 1: Basic capture / signal handling
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nGroup 1: Basic capture');

test('signal and plain variable both captured in state', () => {
  const out = compile(`
    const count = useSignal(0);
    const step = 5;
    const h = $(() => { count.value += step; });
  `);
  assert.ok(out.code.includes('JSON.stringify'), 'must have JSON.stringify');
  assert.ok(out.code.includes('count.value'), 'signal must serialize as .value');
  const vars = capturedVars(out.code);
  assert.ok(vars.includes('count'), 'count must be captured');
  assert.ok(vars.includes('step'), 'step must be captured');
});

test('variables not referenced in chunk are not captured', () => {
  const out = compile(`
    const count = useSignal(0);
    const unused = 99;
    const h = $(() => { count.value += 1; });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('unused'), 'unused must NOT be captured');
});

test('server$() variables excluded from state', () => {
  const out = compile(`
    const doAction = server$(async () => ({ ok: true }));
    const handleClick = $(() => { doAction(); });
  `);
  assert.ok(!out.code.includes('"doAction"'), 'server action var must not appear in state');
  assert.ok(!out.code.includes('doAction.value'), 'server action must not be treated as signal');
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 2: Arrow function params — must NOT be captured
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nGroup 2: Arrow function params');

test('.map(x => ...) param is not captured', () => {
  const out = compile(`
    const items = useSignal([]);
    const h = $(() => { items.value.map(x => x * 2); });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('x'), 'arrow param x must NOT be captured');
  assert.ok(vars.includes('items'), 'outer items must be captured');
});

test('.filter(item => ...) param is not captured', () => {
  const out = compile(`
    const list = useSignal([]);
    const h = $(() => { list.value.filter(item => item.active); });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('item'), 'arrow param item must NOT be captured');
});

test('.find(i => ...) param is not captured, outer var IS captured', () => {
  const out = compile(`
    const items = useSignal([]);
    const selectedId = 'abc';
    const h = $(() => { items.value.find(i => i.id === selectedId); });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('i'), 'arrow param i must NOT be captured');
  assert.ok(vars.includes('selectedId'), 'outer selectedId must be captured');
});

test('.reduce((acc, cur) => ...) params are not captured', () => {
  const out = compile(`
    const nums = useSignal([]);
    const h = $(() => { nums.value.reduce((acc, cur) => acc + cur, 0); });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('acc'), 'acc must NOT be captured');
  assert.ok(!vars.includes('cur'), 'cur must NOT be captured');
});

test('destructured arrow param ({id}) is not captured', () => {
  const out = compile(`
    const items = useSignal([]);
    const h = $(() => { items.value.filter(({id}) => id > 0); });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('id'), 'destructured param id must NOT be captured');
});

test('destructured array arrow param ([first]) is not captured', () => {
  const out = compile(`
    const pairs = useSignal([]);
    const h = $(() => { pairs.value.map(([first, second]) => first + second); });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('first'), 'first must NOT be captured');
  assert.ok(!vars.includes('second'), 'second must NOT be captured');
});

test('rest param (...args) in nested arrow is not captured', () => {
  const out = compile(`
    const fn = useSignal(null);
    const h = $(() => { [1].map((...args) => args[0]); });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('args'), 'rest param args must NOT be captured');
});

test('default param (x = 1) in nested arrow is not captured', () => {
  const out = compile(`
    const list = useSignal([]);
    const h = $(() => { list.value.map((x = 1) => x); });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('x'), 'default param x must NOT be captured');
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 3: Nested arrow functions
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nGroup 3: Nested arrow functions');

test('doubly-nested arrow params are not captured', () => {
  const out = compile(`
    const matrix = useSignal([]);
    const h = $(() => { matrix.value.map(row => row.map(cell => cell * 2)); });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('row'), 'outer loop param row must NOT be captured');
  assert.ok(!vars.includes('cell'), 'inner loop param cell must NOT be captured');
  assert.ok(vars.includes('matrix'), 'outer matrix must be captured');
});

test('outer variable remains captured when inner arrow uses same-named param', () => {
  // `x` in outer scope should be captured; inner arrow `x` param shadows it but
  // the outer x is still referenced before the inner arrow.
  const out = compile(`
    const x = useSignal(10);
    const h = $(() => {
      console.log(x.value);
      [1,2,3].map(x => x * 2);
    });
  `);
  const vars = capturedVars(out.code);
  assert.ok(vars.includes('x'), 'outer x (signal) must still be captured');
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 4: Try-catch — catch param must NOT be captured
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nGroup 4: Try-catch');

test('catch param e is not captured', () => {
  const out = compile(`
    const val = useSignal(0);
    const h = $(() => {
      try { val.value++; }
      catch (e) { console.error(e.message); }
    });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('e'), 'catch param e must NOT be captured');
  assert.ok(vars.includes('val'), 'outer val must be captured');
});

test('catch param with long name is not captured', () => {
  const out = compile(`
    const req = useSignal(null);
    const h = $(() => {
      try { req.value = fetch('/api'); }
      catch (networkError) { console.warn(networkError); }
    });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('networkError'), 'catch param networkError must NOT be captured');
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 5: Block-scoped variables inside chunk
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nGroup 5: Block-scoped variables');

test('const declared inside chunk is not captured', () => {
  const out = compile(`
    const total = useSignal(0);
    const h = $(() => {
      const tax = total.value * 0.1;
      total.value += tax;
    });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('tax'), 'inner const tax must NOT be captured');
  assert.ok(vars.includes('total'), 'outer total must be captured');
});

test('let declared inside chunk is not captured', () => {
  const out = compile(`
    const count = useSignal(0);
    const h = $(() => {
      let i = 0;
      while (i < 3) { count.value++; i++; }
    });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('i'), 'inner let i must NOT be captured');
});

test('destructured const inside chunk is not captured', () => {
  const out = compile(`
    const data = useSignal({});
    const h = $(() => {
      const { name, age } = data.value;
      console.log(name, age);
    });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('name'), 'destructured name must NOT be captured');
  assert.ok(!vars.includes('age'), 'destructured age must NOT be captured');
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 6: For-loop variables
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nGroup 6: For-loop variables');

test('for-loop counter (let i) is not captured', () => {
  const out = compile(`
    const count = useSignal(0);
    const h = $(() => {
      for (let i = 0; i < 5; i++) { count.value++; }
    });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('i'), 'for-loop var i must NOT be captured');
  assert.ok(vars.includes('count'), 'outer count must be captured');
});

test('for-of simple variable is not captured', () => {
  const out = compile(`
    const items = useSignal([]);
    const h = $(() => {
      for (const item of items.value) { console.log(item); }
    });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('item'), 'for-of var item must NOT be captured');
});

test('for-of destructured object is not captured', () => {
  const out = compile(`
    const items = useSignal([]);
    const h = $(() => {
      for (const {id, name} of items.value) { console.log(id, name); }
    });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('id'), 'destructured id must NOT be captured');
  assert.ok(!vars.includes('name'), 'destructured name must NOT be captured');
  assert.ok(vars.includes('items'), 'outer items must be captured');
});

test('for-of destructured array is not captured', () => {
  const out = compile(`
    const pairs = useSignal([]);
    const h = $(() => {
      for (const [a, b] of pairs.value) { console.log(a + b); }
    });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('a'), 'a must NOT be captured');
  assert.ok(!vars.includes('b'), 'b must NOT be captured');
});

test('for-in key variable is not captured', () => {
  const out = compile(`
    const obj = useSignal({});
    const h = $(() => {
      for (const key in obj.value) { console.log(key); }
    });
  `);
  const vars = capturedVars(out.code);
  assert.ok(!vars.includes('key'), 'for-in key must NOT be captured');
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n─────────────────────────────────────`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('Some tests failed.');
  process.exit(1);
} else {
  console.log('All compiler tests passed.');
}
