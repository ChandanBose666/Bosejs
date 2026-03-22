/**
 * Bose global compiler markers.
 *
 * Add to your tsconfig.json to enable autocompletion and type-checking:
 * @example
 * {
 *   "compilerOptions": {
 *     "types": ["bose/globals"]
 *   }
 * }
 *
 * Or with a triple-slash reference at the top of a file:
 * @example
 * /// <reference types="bose/globals" />
 */
import type { Signal } from '@bosejs/state';

// ── Chunk descriptor ──────────────────────────────────────────────────────────

/**
 * The object that `$()` evaluates to at runtime (after compiler transformation).
 * Use `.chunk` as the value of a `bose:on:*` attribute.
 *
 * @example
 * const increment = $(() => { count.value++; });
 * // HTML: bose:on:click="${increment.chunk}"
 */
interface BoseChunkDescriptor {
  /** Relative URL to the lazy-loaded JS chunk, e.g. `"chunks/chunk_abc123.js"` */
  chunk: string;
  /** Names of the captured outer variables serialised into `bose:state`. */
  props: string[];
  /** Subset of `props` that are signals (reconstructed as `Signal` on resumption). */
  signals: string[];
}

// ── Global declarations ───────────────────────────────────────────────────────

declare global {
  /**
   * **Bose closure marker** — a global compile-time function. No import needed.
   *
   * Wrap any interactive logic in `$()`. The Bose compiler extracts the closure
   * into a separate JS chunk that is fetched lazily on first interaction.
   * The page loads with **0 bytes** of component JS until the user interacts.
   *
   * The captured variables are serialised into `bose:state` HTML attributes so
   * the chunk can resume execution without re-running the component.
   *
   * @returns A `BoseChunkDescriptor` at runtime. Use `.chunk` in `bose:on:*`.
   *
   * @example
   * const count = useSignal(0);
   * const increment = $(() => { count.value++; });
   * // Template: bose:on:click="${increment.chunk}"
   *             bose:state='${JSON.stringify({ count: count.value })}'
   */
  function $<T extends (...args: unknown[]) => unknown>(fn: T): BoseChunkDescriptor;

  /**
   * **Server action marker** — a global compile-time function. No import needed.
   *
   * The enclosed function runs **only on the server**. The compiler strips the
   * implementation and replaces it with an auto-generated RPC stub that calls
   * `/_bose_action`. The server function body never ships to the browser.
   *
   * @returns An async function with the same signature as `fn`.
   *
   * @example
   * const deletePost = server$(async (id: number) => {
   *   await db.posts.delete(id); // ← never reaches the browser
   * });
   * // In a $() handler:
   * const handleDelete = $(() => deletePost(postId));
   */
  function server$<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => TReturn | Promise<TReturn>
  ): (...args: TArgs) => Promise<Awaited<TReturn>>;

  /**
   * **Scoped CSS-in-JS marker** — a global compile-time function. No import needed.
   *
   * Accepts a CSS string and returns a map of original class names to their
   * deterministically hashed, scoped equivalents. All scoping is done at
   * **compile time** — zero runtime overhead.
   *
   * @returns A record mapping original class names to scoped class names.
   *
   * @example
   * const styles = css$(`
   *   .btn { background: #6366f1; color: white; border-radius: 0.5rem; }
   *   .btn-danger { background: #ef4444; }
   * `);
   * // Use: class="${styles.btn}" or class="${styles['btn-danger']}"
   */
  function css$(css: string): Record<string, string>;
}

export {};
