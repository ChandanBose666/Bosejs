/**
 * @bosejs/state — Fine-grained reactive signals for Bose.
 */

/**
 * A reactive value container. When `.value` is set, the runtime propagates
 * the change to all DOM nodes bound to this signal's ID via `bose:bind`.
 *
 * @example
 * const count = useSignal(0);
 * count.value++; // triggers DOM update for [bose:bind="count"]
 */
export declare class Signal<T> {
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
 * to share the same global signal (Bose's "Nervous System" feature):
 *
 * @example
 * // Automatic ID injection (recommended) — compiler fills it in:
 * const count = useSignal(0);
 *
 * @example
 * // Explicit shared ID — both islands react to the same signal:
 * const count = useSignal(0, 'cart-item-count');
 */
export declare function useSignal<T>(initialValue: T, id?: string): Signal<T>;
