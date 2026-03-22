import { defineConfig } from 'vite';
import bosePlugin from './packages/core/vite-plugin.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    bosePlugin({
      outputDir: 'playground/public/chunks'
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
  }
});
