const { defineConfig } = require('vite');
const bosePlugin = require('./packages/core/vite-plugin');
const path = require('path');

module.exports = defineConfig({
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
      '@bose/runtime': path.resolve(__dirname, 'packages/runtime/bose-loader.js')
    }
  }
});
