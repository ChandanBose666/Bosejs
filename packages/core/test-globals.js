/**
 * Verifies SSR dummy globals match BoseChunkDescriptor shape.
 * Run: node packages/core/test-globals.js
 */
import assert from 'assert';

global.css$ = () => ({});
global.$ = () => ({ chunk: 'dummy.js', props: [], signals: [], state: '{}' });
global.server$ = () => (async () => ({}));

const descriptor = global.$();
assert.ok('chunk' in descriptor, 'descriptor must have chunk');
assert.ok('props' in descriptor, 'descriptor must have props');
assert.ok('signals' in descriptor, 'descriptor must have signals');
assert.ok('state' in descriptor, 'descriptor must have state');
assert.strictEqual(typeof descriptor.state, 'string', 'state must be a string');

console.log('PASS: SSR dummy $() returns correct BoseChunkDescriptor shape');
