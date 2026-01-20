const babel = require('@babel/core');
const boseOptimizer = require('../compiler/optimizer');
const path = require('path');
const fs = require('fs');
const { marked } = require('marked');
const matter = require('gray-matter');

module.exports = function bosePlugin(options = {}) {
  const outputDir = options.outputDir || 'playground/public/chunks';
  const actionEndpoint = options.actionEndpoint || '/_bose_action';
  const pagesDir = path.resolve(process.cwd(), options.pagesDir || 'src/pages');

  return {
    name: 'vite-plugin-bose',
    
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // 1. Handle RPC Actions
        if (req.url === actionEndpoint && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { id, args } = JSON.parse(body);
              console.log(`[Bose RPC] Invoking: ${id} with args:`, args);
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

        // 2. File-based Routing Engine
        if (req.method === 'GET' && !req.url.includes('.')) {
          console.log(`[Bose Router] Matching route: ${req.url}`);
          const urlPath = req.url === '/' ? '/index' : req.url;
          
          let targetFile = null;
          let params = {};

          // Simple dynamic routing match: /product/123 -> src/pages/product/[id].js
          const files = fs.readdirSync(pagesDir, { recursive: true });
          for (const file of files) {
            const relPath = '/' + file.replace(/\.(js|md)$/, '').replace(/\\/g, '/');
            const pattern = relPath.replace(/\[([^\]]+)\]/g, '(?<$1>[^/]+)');
            const match = urlPath.match(new RegExp(`^${pattern}$`));
            
            if (match) {
              targetFile = path.join(pagesDir, file);
              params = match.groups || {};
              break;
            }
          }

          if (targetFile) {
            const content = fs.readFileSync(targetFile, 'utf-8');
            // In a real framework, we'd use Vite's transformIndexHtml and SSR SSR logic
            // For PoC, we send a simplified HTML shell
            const styles = (global.__BOSE_STYLES__ || []).join('\n');
            res.setHeader('Content-Type', 'text/html');
            res.end(`
              <!DOCTYPE html>
              <html>
                <head>
                  <style>${styles}</style>
                  <script type="module" src="/packages/runtime/bose-loader.js"></script>
                </head>
                <body>
                  <div id="root">Rendering ${path.basename(targetFile)} with params ${JSON.stringify(params)}</div>
                  <script type="module">
                    // Simulate Client-side resumption
                    console.log('[Bose Runtime] Route matched:', ${JSON.stringify(req.url)});
                  </script>
                </body>
              </html>
            `);
            return;
          }
        }
        next();
      });
    },

    transform(code, id) {
      if (id.endsWith('.md')) {
        const { data, content } = matter(code);
        const html = marked(content);
        // Transform Markdown into a Bose component string
        code = `export const frontmatter = ${JSON.stringify(data)};
                export default function() {
                  return \`${html}\`;
                }`;
      }

      if (!id.endsWith('.bose') && !id.endsWith('.js') && !id.endsWith('.md')) return null;
      if (id.includes('node_modules')) return null;

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
