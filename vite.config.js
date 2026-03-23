import { defineConfig } from 'vite';
import bosePlugin from './packages/core/vite-plugin.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    bosePlugin({
      outputDir: 'public/chunks'
    })
  ],
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      '@bosejs/runtime': path.resolve(__dirname, 'packages/runtime/bose-loader.js'),
      '@bosejs/state': path.resolve(__dirname, 'packages/state/index.js')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Bundle the two browser-side scripts as named entries so they land at
      // /bose-runtime.js and /bose-state.js — matching the URLs in the HTML shell
      // and the importmap the plugin injects.
      // preserveEntrySignatures: keep all named exports (Signal, useSignal) even
      // when nothing inside the bundle explicitly imports them — chunks loaded
      // at runtime via dynamic import() depend on these exports.
      preserveEntrySignatures: 'exports-only',
      input: {
        'bose-runtime': path.resolve(__dirname, 'packages/runtime/bose-loader.js'),
        'bose-state':   path.resolve(__dirname, 'packages/state/index.js'),
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',   // → dist/bose-runtime.js, dist/bose-state.js
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
