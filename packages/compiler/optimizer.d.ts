/**
 * @bosejs/compiler — Babel plugin for closure extraction and resumability.
 */

/** Minimal shape of a Babel plugin object (avoids a hard dep on @babel/core types). */
export interface BabelPluginObject {
  name: string;
  pre?(this: BabelPluginPass): void;
  post?(this: BabelPluginPass): void;
  visitor: Record<string, unknown>;
}

/** Minimal PluginPass surface used internally. */
export interface BabelPluginPass {
  filename: string | undefined | null;
  opts: BoseOptimizerOptions;
  boseStyles: string[];
}

export interface BoseOptimizerOptions {
  /**
   * Absolute path to the directory where extracted chunks are written
   * in dev mode (fs.writeFileSync). In production builds the Vite plugin
   * uses emitFile instead and this path is not used.
   * @default 'dist/chunks'
   */
  outputDir?: string;

  /**
   * When provided by vite-plugin.js, extracted chunks are added to this Map
   * instead of being written to disk. The Vite plugin then decides whether to
   * call emitFile (build) or fs.writeFileSync (dev).
   *
   * Not needed when using the compiler standalone.
   */
  chunkCollector?: Map<string, string>;
}

/** Babel plugin factory. Pass to `babel.transform` via the `plugins` option. */
export default function boseOptimizer(): () => BabelPluginObject;
