/**
 * @bosejs/state — Fine-grained reactive signals for Bose.
 */

/**
 * A reactive value container. When `.value` is set, the runtime propagates
 * the change to all DOM nodes bound to this signal's ID via `bose:bind`.
 */
export declare class Signal<T = unknown> {
  /** Stable ID used to identify this signal in the DOM and runtime registry. */
  readonly id: string;

  constructor(value: T, id: string);

  /** Read or update the signal value. Setting triggers DOM synchronization. */
  get value(): T;
  set value(newValue: T);

  /** Notify all subscribers and sync bound DOM nodes. */
  notify(): void;

  /** Returns the raw value for JSON serialization (used by bose:state). */
  toJSON(): T;
}

/**
 * Create a reactive signal.
 *
 * The `id` parameter is normally injected automatically by the Bose compiler.
 * You only need to supply it explicitly when you want two independent islands
 * to share the same global signal (Bose's "Nervous System" feature).
 *
 * @example
 * const count = useSignal(0);            // compiler injects ID
 * const cart = useSignal(0, 'cart-count'); // explicit shared ID
 */
export declare function useSignal<T>(initialValue: T, id?: string): Signal<T>;

/**
 * Seed signal initial values for the current SSR request.
 *
 * Call this in a page handler before any `useSignal` call. The values are
 * stored in a per-request `AsyncLocalStorage` context and read by `useSignal`
 * to override the `initialValue` fallback during server-side rendering.
 *
 * No-op in the browser (where `AsyncLocalStorage` is unavailable).
 * No-op if called outside a `storage.run()` context (e.g. in tests without setup).
 *
 * @example
 * export default async function CartPage({ params }) {
 *   setSSRContext({ 'cart-count': await cartStore.getCount() });
 *   const cartCount = useSignal(0, 'cart-count'); // resolves to real count
 * }
 */
export declare function setSSRContext(values: Record<string, unknown>): void;
