/**
 * BOSE HYDRATION MANAGER
 *
 * Server-side: collect signal values during SSR, serialize to a <script> tag.
 * Client-side: read that script tag on first access, populate an in-memory Map.
 *
 * Usage (server):
 *   import { hydration } from '@bosejs/runtime/hydration';
 *   hydration.set('cart', cartItems);
 *   // In HTML shell: ${hydration.serialize()}
 *
 * Usage (client — auto-bootstrapped by bose-loader.js):
 *   hydration.get('cart', [])  // reads from DOM script tag, then Map
 */

const SCRIPT_ID = '__BOSE_HYDRATION__';

class HydrationManager {
  constructor() {
    /** @type {Map<string, unknown>} */
    this._store = new Map();
    this._hydrated = false;
  }

  // ── Server-side API ────────────────────────────────────────────────────────

  /**
   * Store a value to be serialized into the HTML shell.
   * Call during SSR before serialize() is invoked.
   * @param {string} key
   * @param {unknown} value — must be JSON-serializable
   */
  set(key, value) {
    this._store.set(key, value);
  }

  /**
   * Serialize all stored values to an inline <script> tag.
   * Insert the result verbatim into the HTML <head> or before </body>.
   * @returns {string} HTML script tag, or '' if nothing was stored.
   */
  serialize() {
    if (this._store.size === 0) return '';
    const payload = {};
    for (const [k, v] of this._store) payload[k] = v;
    // type="application/json" — never executed by the browser, only read as text.
    return `<script id="${SCRIPT_ID}" type="application/json">${JSON.stringify(payload)}</script>`;
  }

  // ── Client-side API ────────────────────────────────────────────────────────

  /**
   * Parse the injected <script> tag and populate the in-memory store.
   * Safe to call multiple times — subsequent calls are no-ops.
   * Removes the script tag from the DOM after parsing to keep the DOM clean.
   */
  hydrateFromScript() {
    if (this._hydrated) return;
    this._hydrated = true;

    if (typeof document === 'undefined') return;

    const el = document.getElementById(SCRIPT_ID);
    if (!el) return;

    try {
      const data = JSON.parse(el.textContent || '{}');
      for (const [k, v] of Object.entries(data)) {
        this._store.set(k, v);
      }
    } catch (e) {
      console.warn('[Bose] Failed to parse hydration payload:', e);
    }

    el.parentNode && el.parentNode.removeChild(el);
  }

  /**
   * Retrieve a value. On the client, triggers hydration from the DOM on first call.
   * @param {string} key
   * @param {unknown} fallback — returned if the key is absent
   * @returns {unknown}
   */
  get(key, fallback) {
    // Lazily hydrate from DOM script tag (client only).
    if (!this._hydrated && typeof document !== 'undefined') {
      this.hydrateFromScript();
    }
    return this._store.has(key) ? this._store.get(key) : fallback;
  }

  /**
   * Whether hydration from the DOM script tag has been completed.
   * @returns {boolean}
   */
  isComplete() {
    return this._hydrated;
  }
}

export const hydration = new HydrationManager();

// ── createHydratableSignal ─────────────────────────────────────────────────

/**
 * Create a signal whose initial value is sourced from hydration data,
 * sessionStorage/localStorage, or a provided default — in that order of preference.
 *
 * On the server:
 *   - Reads hydration.get(key) as the initial value (set by server code before render).
 *   - Subscribes to save every value change back into hydration, so it appears in serialize().
 *
 * On the client:
 *   - Checks storage (sessionStorage or localStorage) first.
 *   - Falls back to hydration.get(key) (from the injected script tag).
 *   - Falls back to initialValue.
 *   - Auto-syncs changes back to storage.
 *
 * @param {string} key — unique signal key; must match what server uses
 * @param {unknown} initialValue — used when no hydrated/stored value exists
 * @param {{ storage?: 'session' | 'local' | null }} [options]
 * @returns {import('@bosejs/state').Signal}
 */
export async function createHydratableSignal(key, initialValue, options = {}) {
  // Dynamic import avoids circular dependency and keeps this module
  // usable in both server and browser contexts without require().
  const { useSignal, Signal } = await import('@bosejs/state');

  const storageType = options.storage ?? null;
  const isServer =
    typeof process !== 'undefined' &&
    process.versions &&
    process.versions.node &&
    typeof document === 'undefined';

  let resolvedValue = initialValue;

  if (isServer) {
    // Server: pull from hydration store (set by page handler before calling this).
    const hydrated = hydration.get(key, initialValue);
    resolvedValue = hydrated;
  } else {
    // Client: storage → hydration payload → initialValue.
    const storageApi =
      storageType === 'local'
        ? (typeof localStorage !== 'undefined' ? localStorage : null)
        : storageType === 'session'
        ? (typeof sessionStorage !== 'undefined' ? sessionStorage : null)
        : null;

    if (storageApi) {
      try {
        const stored = storageApi.getItem(`bose:${key}`);
        if (stored !== null) {
          resolvedValue = JSON.parse(stored);
        } else {
          resolvedValue = hydration.get(key, initialValue);
        }
      } catch {
        resolvedValue = hydration.get(key, initialValue);
      }
    } else {
      resolvedValue = hydration.get(key, initialValue);
    }
  }

  const signal = useSignal(resolvedValue, key);

  if (isServer) {
    // On the server, mirror every write into hydration so serialize() captures it.
    const origSet = Object.getOwnPropertyDescriptor(Signal.prototype, 'value').set;
    Object.defineProperty(signal, 'value', {
      get() { return signal._value; },
      set(v) {
        origSet.call(signal, v);
        hydration.set(key, v);
      },
      configurable: true,
    });
    // Seed hydration with the initial resolved value.
    hydration.set(key, resolvedValue);
  } else {
    // On the client, persist every write back to storage.
    const storageApi =
      storageType === 'local'
        ? (typeof localStorage !== 'undefined' ? localStorage : null)
        : storageType === 'session'
        ? (typeof sessionStorage !== 'undefined' ? sessionStorage : null)
        : null;

    if (storageApi) {
      const origSet = Object.getOwnPropertyDescriptor(Signal.prototype, 'value').set;
      Object.defineProperty(signal, 'value', {
        get() { return signal._value; },
        set(v) {
          origSet.call(signal, v);
          try { storageApi.setItem(`bose:${key}`, JSON.stringify(v)); } catch { /* quota */ }
        },
        configurable: true,
      });
    }
  }

  return signal;
}
