/**
 * Manual test for setSSRContext + useSignal SSR hydration.
 * Run: node packages/state/test.js
 */
import assert from 'assert';

// Import the module under test. __ssrStorage is the AsyncLocalStorage instance
// created inside index.js — we use it here so the test shares the same instance.
const { useSignal, setSSRContext, __ssrStorage } = await import('./index.js');

assert.ok(__ssrStorage, '__ssrStorage must be available in Node.js environment');

// Test 1: useSignal falls back to initialValue when no SSR context is set
{
  const sig = useSignal(42, 'test-signal');
  assert.strictEqual(sig.value, 42, 'Should use initialValue when no SSR context');
  console.log('PASS: useSignal falls back to initialValue outside context');
}

// Test 2: setSSRContext seeds the initial value inside a storage.run() context
{
  let result;
  await __ssrStorage.run({}, async () => {
    setSSRContext({ 'cart-count': 7 });
    result = useSignal(0, 'cart-count');
  });
  assert.strictEqual(result.value, 7, 'Should use SSR context value when set');
  console.log('PASS: useSignal uses setSSRContext value inside run()');
}

// Test 3: Two concurrent contexts do not bleed into each other.
{
  let resolveA, resolveB;
  const barrierA = new Promise(r => { resolveA = r; });
  const barrierB = new Promise(r => { resolveB = r; });
  let resultA, resultB;

  await Promise.all([
    __ssrStorage.run({}, async () => {
      setSSRContext({ 'user-id': 'alice' });
      resolveA();
      await barrierB;
      resultA = useSignal('unknown', 'user-id');
    }),
    __ssrStorage.run({}, async () => {
      setSSRContext({ 'user-id': 'bob' });
      resolveB();
      await barrierA;
      resultB = useSignal('unknown', 'user-id');
    }),
  ]);
  assert.strictEqual(resultA.value, 'alice', 'Context A should see alice');
  assert.strictEqual(resultB.value, 'bob', 'Context B should see bob');
  console.log('PASS: concurrent contexts are isolated');
}

// Test 4: setSSRContext is a no-op outside storage.run()
{
  setSSRContext({ 'should-not-bleed': 99 });
  const sig = useSignal(0, 'should-not-bleed');
  assert.strictEqual(sig.value, 0, 'setSSRContext outside run() should be no-op');
  console.log('PASS: setSSRContext is no-op outside run()');
}

console.log('\nAll state tests passed.');
