/**
 * BOSE SIGNALS
 * Fine-grained reactivity for resumable frameworks.
 */

// Node-only guard: use dynamic import so this module is browser-safe.
// `async_hooks` does not exist in browsers — the catch makes storage null,
// which causes setSSRContext and the store check to be silent no-ops.
// Top-level await is valid here: the package is pure ESM (type: "module"),
// Node >= 14.8 supports it, and bundlers (Vite/webpack) handle it correctly.
let storage = null;
try {
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    const { AsyncLocalStorage } = await import('async_hooks');
    storage = new AsyncLocalStorage();
  }
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

/**
 * Retrieve all signal values set via setSSRContext for the current request.
 * Returns undefined outside a storage.run() context or in the browser.
 */
export function getSSRContext() {
  if (!storage) return undefined;
  const store = storage.getStore();
  return store ? { ...store } : undefined;
}

/** Exposed for the Vite plugin to create a fresh per-request context. */
export { storage as __ssrStorage };
