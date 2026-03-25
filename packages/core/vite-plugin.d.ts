/**
 * bose — Vite plugin type declarations.
 */
import type { Plugin } from 'vite';

export interface BosePluginOptions {
  /**
   * Directory where extracted interaction chunks are written during dev.
   * In production builds chunks are emitted via Vite's `emitFile` API instead.
   * @default 'playground/public/chunks'
   */
  outputDir?: string;

  /**
   * URL path that handles `server$()` RPC calls.
   * @default '/_bose_action'
   */
  actionEndpoint?: string;

  /**
   * Directory that contains your page components.
   * Files here are mapped to routes: `index.js` → `/`, `about.js` → `/about`.
   * Supports dynamic segments: `product/[id].js` → `/product/:id`.
   * @default 'src/pages'
   */
  pagesDir?: string;
}

/**
 * Bose Vite plugin.
 *
 * Automatically configures:
 * - `optimizeDeps.exclude` for all `@bosejs/*` packages (pure ESM, top-level await)
 * - `ssr.noExternal` for all `@bosejs/*` packages (keeps ESM intact during SSR)
 * - HMR invalidation for files using `$()` and `server$()` markers
 *
 * Minimal `vite.config.js`:
 * @example
 * import { defineConfig } from 'vite';
 * import bosePlugin from '@bosejs/core';
 *
 * export default defineConfig({
 *   plugins: [bosePlugin()],
 * });
 */
export default function bosePlugin(options?: BosePluginOptions): Plugin;
