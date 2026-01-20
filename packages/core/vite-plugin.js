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
  const actionEndpoint = options.actionEndpoint || '/_bose_action';

  // Temporary action registry for the dev session
  const actionRegistry = new Map();

  return {
    name: 'vite-plugin-bose',
    
    // Vite Dev Server Hook
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === actionEndpoint && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { id, args } = JSON.parse(body);
              console.log(`[Bose RPC] Invoking: ${id} with args:`, args);
              
              // In this PoC, we'll simulate the execution
              // In production, we'd lookup the function from a manifest
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: true, 
                data: `Server received: ${args[0]}`,
                processedAt: new Date().toISOString()
              }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
        next();
      });
    },
    
    // Transform Components
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
