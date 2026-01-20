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

  // SSR Safety Net: Provide a global dummy for Bose markers
  global.css$ = (css) => ({});
  global.$ = (fn) => ({ chunk: 'dummy.js', props: [] });
  global.server$ = (fn) => (async () => ({}));

  return {
    name: 'vite-plugin-bose',
    
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // 0. Serve Bose Runtime
        if (req.url === '/bose-runtime.js') {
          const runtimePath = path.resolve(__dirname, '../runtime/bose-loader.js');
          res.setHeader('Content-Type', 'application/javascript');
          res.end(fs.readFileSync(runtimePath, 'utf-8'));
          return;
        }

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
            let htmlContent = '';
            try {
              // Reset styles for each request to avoid duplication
              global.__BOSE_STYLES__ = [];
              
              // Unified SSR Loading: Triggers our 'transform' hook automatically
              const module = await server.ssrLoadModule(targetFile);
              const component = module.default;
              
              // Execute the component (JS or Transformed Markdown)
              htmlContent = typeof component === 'function' ? await component({ params }) : component;
            } catch (e) {
              console.error(`[Bose SSR Error] ${targetFile}:`, e);
              htmlContent = `<div style="padding: 2rem; background: #fee2e2; color: #991b1b; border-radius: 0.5rem; margin: 2rem;">
                                <h3>SSR Rendering Error</h3>
                                <pre>${e.message}</pre>
                             </div>`;
            }

            const styles = (global.__BOSE_STYLES__ || []).join('\n');
            res.setHeader('Content-Type', 'text/html');
            
            if (process.env.DEBUG_BOSE) {
               console.log(`[Bose SSR] Rendering ${targetFile} with content length: ${htmlContent.length}`);
            }

            res.end(`
              <!DOCTYPE html>
              <html lang="en" class="dark">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Bosejs | The All-Powerful Framework</title>
                  <link rel="preconnect" href="https://fonts.googleapis.com">
                  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
                  <style>
                    :root {
                      --bg: #020617;
                      --text: #f8fafc;
                      --primary: #6366f1;
                      --accent: #22d3ee;
                    }
                    * { box-sizing: border-box; }
                    body { 
                      margin: 0; 
                      font-family: 'Inter', sans-serif; 
                      background-color: var(--bg); 
                      color: var(--text);
                      line-height: 1.5;
                      -webkit-font-smoothing: antialiased;
                    }
                    a { color: var(--primary); text-decoration: none; transition: opacity 0.2s; }
                    a:hover { opacity: 0.8; }
                    pre { 
                      background: #0f172a; 
                      padding: 1.25rem; 
                      border-radius: 0.75rem; 
                      overflow-x: auto; 
                      border: 1px solid #1e293b;
                      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                    }
                    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 0.9em; }
                    .container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
                    ${styles}
                  </style>
                  <script type="module" src="/bose-runtime.js"></script>
                </head>
                <body>
                  <div id="root">${htmlContent}</div>
                </body>
              </html>
            `);
            return;
          }
        }
        next();
      });
    },

    async transform(code, id) {
      const isMd = id.endsWith('.md');
      const isJs = id.endsWith('.js') || id.endsWith('.bose');
      
      if (!isMd && !isJs) return null;
      if (id.includes('node_modules')) return null;

      try {
        let targetCode = code;

        if (isMd) {
          const { data, content } = matter(code);
          const safeContent = content
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`');
            
          targetCode = `
            import { marked } from 'marked';
            export const frontmatter = ${JSON.stringify(data)};
            export default async function(props = {}) {
              const { params } = props;
              const content = \`${safeContent}\`;
              return marked(content);
            }
          `;
        }

        const result = babel.transformSync(targetCode, {
          plugins: [
            ['@babel/plugin-syntax-jsx'],
            [boseOptimizer, { outputDir: path.resolve(process.cwd(), outputDir) }]
          ],
          filename: id + '.js',
          sourceMaps: true
        });

        return {
          code: result.code,
          map: result.map
        };
      } catch (err) {
        fs.appendFileSync('bose-error.log', `Error in ${id}: ${err.message}\n`);
        return null;
      }
    }
  };
};
