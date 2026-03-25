/**
 * BOSE SIGNALS
 * Fine-grained reactivity for resumable frameworks.
 */

// Node-only guard: synchronous require so this works at module load time.
// AsyncLocalStorage is not available in the browser — the catch makes storage
// null safely, which causes setSSRContext and the store check to be no-ops.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let storage = null;
try {
  const { AsyncLocalStorage } = require('async_hooks');
  storage = new AsyncLocalStorage();
} catch {
  // Browser, Deno, or environment without async_hooks.
}

export class Signal {
  constructor(value, id) {
    this._value = value;
    this.id = id;
    this.subscribers = new Set();
  }

  get value() {
    // If we're in a "Tracking" phase, add the current subscriber
    if (context.activeSubscriber) {
      this.subscribers.add(context.activeSubscriber);
    }
    return this._value;
  }

  set value(newValue) {
    if (this._value === newValue) return;
    this._value = newValue;
    this.notify();
  }

  notify() {
    this.subscribers.forEach(sub => sub.update(this._value));
    
    // Global notification for resumable synchronization
    if (typeof window !== 'undefined' && window.__BOSE_SYNC__) {
        window.__BOSE_SYNC__(this.id, this._value);
    }
  }

  toJSON() {
    return this._value;
  }
}

const context = {
  activeSubscriber: null
};

/**
 * Seed signal initial values for the current SSR request.
 * Call before useSignal in a page handler. No-op in the browser.
 */
export function setSSRContext(values) {
  if (!storage) return;
  const store = storage.getStore();
  if (!store) return; // called outside storage.run() — safely ignored
  Object.assign(store, values);
}

export function useSignal(initialValue, id) {
  let value = initialValue;
  // Check SSR context: if a value is registered for this signal ID, use it.
  if (storage && id) {
    const store = storage.getStore();
    if (store && Object.prototype.hasOwnProperty.call(store, id)) {
      value = store[id];
    }
  }
  return new Signal(value, id);
}

/** Exposed for the Vite plugin to create a fresh per-request context. */
export { storage as __ssrStorage };
