import { defineConfig } from 'vite';
import bosePlugin from 'bose';

export default defineConfig({
  plugins: [
    bosePlugin({
      outputDir: 'public/chunks',
      pagesDir: 'src/pages'
    })
  ],
  server: {
    port: 3000,
    allowedHosts: [
      'bose-production.up.railway.app',
      '.up.railway.app',
      'localhost',
      '.localtunnel.me',
      '.loca.lt'
    ]
  }
});
