/**
 * @bosejs/runtime — HydrationManager type declarations.
 */

import type { Signal } from '@bosejs/state';

/**
 * Options for `createHydratableSignal`.
 */
export interface HydratableSignalOptions {
  /**
   * Which Web Storage API to use for client-side persistence.
   * - `'session'` — `sessionStorage` (cleared when tab closes)
   * - `'local'`   — `localStorage` (persists across sessions)
   * - `null`      — no persistence (default)
   * @default null
   */
  storage?: 'session' | 'local' | null;
}

/**
 * Manages the transfer of server-rendered signal values to the browser.
 *
 * **Server usage:**
 * ```ts
 * import { hydration } from '@bosejs/runtime/hydration';
 * hydration.set('cart-count', 5);
 * // In HTML template: ${hydration.serialize()}
 * ```
 *
 * **Client usage (auto-bootstrapped by bose-loader):**
 * ```ts
 * hydration.get('cart-count', 0); // → 5
 * ```
 */
export declare class HydrationManager {
  /**
   * Store a value to be serialized into the HTML shell.
   * Call during SSR before `serialize()` is invoked.
   */
  set(key: string, value: unknown): void;

  /**
   * Serialize all stored values to an inline `<script type="application/json">` tag.
   * Returns `''` if nothing was stored.
   */
  serialize(): string;

  /**
   * Parse the injected `<script>` tag and populate the in-memory store.
   * Safe to call multiple times — subsequent calls are no-ops.
   * Removes the script tag from the DOM after parsing.
   */
  hydrateFromScript(): void;

  /**
   * Retrieve a value. On the client, triggers DOM hydration on first call.
   * @param key    — the key used when calling `set()` on the server
   * @param fallback — returned when the key is absent
   */
  get<T = unknown>(key: string, fallback: T): T;
  get(key: string, fallback?: unknown): unknown;

  /**
   * Whether hydration from the DOM script tag has been completed.
   */
  isComplete(): boolean;
}

/** Singleton hydration manager. Import this on both server and client. */
export declare const hydration: HydrationManager;

/**
 * Create a signal whose initial value is sourced from hydration data,
 * Web Storage, or a provided default — in that order of preference.
 *
 * On the **server**: reads `hydration.get(key)` and mirrors every write
 * back into the hydration store so `serialize()` captures the final value.
 *
 * On the **client**: checks storage → hydration payload → `initialValue`,
 * then auto-syncs every write back to the selected storage API.
 *
 * @param key          — unique key; must match the key used on the server
 * @param initialValue — fallback when no hydrated or stored value exists
 * @param options      — optional storage persistence settings
 */
export declare function createHydratableSignal<T>(
  key: string,
  initialValue: T,
  options?: HydratableSignalOptions
): Promise<Signal<T>>;
