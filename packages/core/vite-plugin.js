const babel = require('@babel/core');
const boseOptimizer = require('../compiler/optimizer');
const path = require('path');

/**
 * VITE PLUGIN BOSE
 * This plugin hooks into the Vite build pipeline to:
 * 1. Transform components using the Bose Optimizer.
 * 2. Automate the generation of resumable chunks.
 */
module.exports = function bosePlugin(options = {}) {
  const outputDir = options.outputDir || 'dist/chunks';

  return {
    name: 'vite-plugin-bose',
    
    // We only want to transform source files
    transform(code, id) {
      if (!id.endsWith('.bose') && !id.endsWith('.js')) return null;
      if (id.includes('node_modules')) return null;

      console.log(`[Bose Vite] Transforming: ${path.basename(id)}`);

      try {
        const result = babel.transformSync(code, {
          plugins: [
            ['@babel/plugin-syntax-jsx'],
            [boseOptimizer, { outputDir: path.resolve(process.cwd(), outputDir) }]
          ],
          filename: id,
          sourceMaps: true
        });

        return {
          code: result.code,
          map: result.map
        };
      } catch (err) {
        console.error(`[Bose Vite] Error transforming ${id}:`, err.message);
        return null;
      }
    }
  };
};
