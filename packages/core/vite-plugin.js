import babel from '@babel/core';
import boseOptimizer from '@bosejs/compiler';
import path from 'path';
import fs from 'fs';
import { marked } from 'marked';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function bosePlugin(options = {}) {
  const outputDir = options.outputDir || 'public/chunks';
  const actionEndpoint = options.actionEndpoint || '/_bose_action';
  const pagesDir = path.resolve(process.cwd(), options.pagesDir || 'src/pages');

  // SSR Safety Net: Provide global dummy implementations for Bose markers
  // so server-side code never ships closures or CSS to the browser.
  // css$ returns an empty object (no styles at runtime — styles are
  // collected during Babel transform and injected into the HTML shell).
  global.css$ = () => ({});
  global.$ = () => ({ chunk: 'dummy.js', props: [] });
  global.server$ = () => (async () => ({}));

  // Set by configResolved. Drives chunk emission strategy:
  //   dev  → write to disk (Vite dev server serves static files)
  //   build → this.emitFile() (Rollup manages output directory)
  let isBuild = false;

  return {
    name: 'vite-plugin-bose',

    configResolved(config) {
      isBuild = config.command === 'build';
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // 0. Serve Bose Runtime
        if (req.url === '/bose-runtime.js') {
          const runtimePath = _require.resolve('@bosejs/runtime');
          res.setHeader('Content-Type', 'application/javascript');
          res.end(fs.readFileSync(runtimePath, 'utf-8'));
          return;
        }

        // 0.1. Serve Bose State
        if (req.url === '/bose-state.js') {
          const statePath = _require.resolve('@bosejs/state');
          res.setHeader('Content-Type', 'application/javascript');
          res.end(fs.readFileSync(statePath, 'utf-8'));
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
              const module = await server.ssrLoadModule(targetFile);
              const component = module.default;
              htmlContent = typeof component === 'function' ? await component({ params }) : component;
            } catch (e) {
              console.error(`[Bose SSR Error] ${targetFile}:`, e);
              htmlContent = `<div style="padding: 2rem; background: #fee2e2; color: #991b1b; border-radius: 0.5rem; margin: 2rem;">
                               <h3>SSR Rendering Error</h3>
                               <pre>${e.message}</pre>
                            </div>`;
            }

            // Collect all scoped CSS registered during Babel transforms.
            // __BOSE_STYLE_MAP__ is a Map<filename, string[]> populated by
            // the optimizer's post() hook. Each file occupies exactly one entry
            // so there is no unbounded growth and no cross-request accumulation.
            // HMR re-transforms overwrite the entry for their file cleanly.
            const styleMap = global.__BOSE_STYLE_MAP__ || new Map();
            const styles = Array.from(styleMap.values()).flat().join('\n');

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
                  <script type="importmap">
                    {
                      "imports": {
                        "@bosejs/state": "/bose-state.js"
                      }
                    }
                  </script>
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
                      font-family: system-ui, sans-serif;
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
            .replace(/`/g, '\\`')
            .replace(/\$\{/g, '\\${');

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

        // Per-file collector: the Babel plugin fills this Map during transformSync.
        // We process it immediately after — while `this` (Vite plugin context) is still valid.
        const chunkCollector = new Map();
        const resolvedOutputDir = path.resolve(process.cwd(), outputDir);

        const result = babel.transformSync(targetCode, {
          plugins: [
            ['@babel/plugin-syntax-jsx'],
            [boseOptimizer, {
              outputDir: resolvedOutputDir,
              chunkCollector,
            }]
          ],
          filename: id,
          sourceMaps: true
        });

        // Emit or write every chunk the Babel plugin extracted from this file.
        for (const [filename, content] of chunkCollector) {
          if (isBuild) {
            // Production: let Rollup manage the output path and hashing pipeline.
            this.emitFile({
              type: 'asset',
              fileName: `chunks/${filename}`,
              source: content,
            });
          } else {
            // Dev: write to disk so Vite's static file server can serve them.
            if (!fs.existsSync(resolvedOutputDir)) {
              fs.mkdirSync(resolvedOutputDir, { recursive: true });
            }
            fs.writeFileSync(path.join(resolvedOutputDir, filename), content);
          }
        }

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
}
