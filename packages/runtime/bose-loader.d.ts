/**
 * @bosejs/runtime — Browser-side resumable loader type declarations.
 *
 * This package is a browser script with no runtime Node exports.
 * The types below augment the global `window` and `WindowEventMap`
 * so TypeScript-aware projects get autocompletion for Bose's APIs.
 */

/** Detail shape of the 'bose:error' CustomEvent. */
export interface BoseErrorDetail {
  /** Human-readable error message. */
  message: string;
  /**
   * ID of the error boundary that caught the failure, if any.
   * Only present when `recovered` is `true`.
   */
  boundaryId?: string;
  /** Stack trace string. Only present when `recovered` is `false`. */
  stack?: string;
  /**
   * `true`  — the boundary swapped in its fallback UI; the rest of the page
   *            is still interactive.
   * `false` — no boundary was found; the failure was unrecovered.
   */
  recovered: boolean;
}

declare global {
  interface Window {
    /**
     * Called by `Signal.notify()` whenever a reactive value changes.
     * Propagates the new value to all DOM elements bound to `signalId`
     * via `bose:bind` and `bose:bind:style` attributes, and keeps
     * `bose:state` attributes in sync for the next resumption.
     */
    __BOSE_SYNC__: (signalId: string, newValue: unknown) => void;

    /**
     * Set to `true` to enable verbose debug logging in the Bose runtime.
     * Can also be enabled via `localStorage.setItem('boseDebug', '1')`.
     * @default undefined (silent)
     */
    __BOSE_DEBUG__?: boolean;
  }

  interface WindowEventMap {
    /**
     * Fired when a resumption error occurs.
     * Listen on `window` to handle errors from any island:
     *
     * @example
     * window.addEventListener('bose:error', (e) => {
     *   if (!e.detail.recovered) myErrorTracker.capture(e.detail.message);
     * });
     */
    'bose:error': CustomEvent<BoseErrorDetail>;
  }
}

export {};
