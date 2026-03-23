import * as t from '@babel/types';
import generate from '@babel/generator';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Write a chunk to disk.
 * Used in dev mode (Vite dev server serves from the filesystem)
 * and as a standalone fallback when no chunkCollector is provided.
 */
function writeToDisk(outputDir, filename, content) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, filename), content);
}

/**
 * Returns a short deterministic hash from a string.
 * Same input always produces the same 9-character hex ID.
 */
function contentHash(input) {
  return crypto.createHash('sha1').update(input).digest('hex').slice(0, 9);
}

/**
 * Regenerate source from a Babel AST node safely.
 * This avoids the fragile `file.code.slice(node.start, node.end)` pattern,
 * which breaks when prior plugins have already transformed the source.
 */
function nodeToCode(node) {
  // @babel/generator default export varies by version — handle both shapes.
  const gen = typeof generate === 'function' ? generate : generate.default;
  return gen(node).code;
}

/**
 * BOSE OPTIMIZER
 * 1. Finds all instances of $( ... )
 * 2. Extracts the inner function to a new file.
 * 3. Replaces the $( ... ) with the chunk reference.
 */
export default function boseOptimizer() {
  return {
    name: 'bose-optimizer',

    // Called once before traversing each file.
    // Resets per-file style collection so HMR re-transforms start clean.
    pre() {
      this.boseStyles = [];
      // Maps variable name → actionId for server$() assignments in this file.
      // Used by the $() chunk generator to inline RPC calls instead of reading
      // server actions from state (functions can't be JSON-serialized).
      this.serverActionVars = new Map();
    },

    // Called once after traversing each file.
    // Commits collected styles to a global Map keyed by filename.
    // Using a Map (not an array) means each file occupies exactly one entry —
    // no unbounded growth, no cross-request accumulation.
    post() {
      if (!this.boseStyles.length) return;
      if (!global.__BOSE_STYLE_MAP__) global.__BOSE_STYLE_MAP__ = new Map();
      global.__BOSE_STYLE_MAP__.set(this.filename || 'unknown', this.boseStyles);
    },

    visitor: {
      Program(babelPath, state) {
        if (state.filename && (state.filename.includes('Hero.js') || state.filename.includes('index.md'))) {
          console.log(`[Bose Optimizer] Processing: ${state.filename}`);
        }
      },
      CallExpression(babelPath, state) {
        const { callee } = babelPath.node;

        // ── useSignal ID injection ──────────────────────────────────────────────
        // If useSignal(value) is called without an explicit ID, inject the
        // variable name as the ID. This must happen before the $() visitor
        // so the inner traversal sees the final, ID-stamped useSignal call.
        //
        // The injected ID is intentionally just the variable name (e.g. 'count'),
        // NOT a file-scoped hash. Reason: the chunk content reconstructs signals
        // as `new Signal(state.count, 'count')` — same name. If we inject a
        // longer ID here, the two sides diverge and __BOSE_SYNC__ breaks.
        //
        // Side-effect: two components with `const count = useSignal(0)` share the
        // same global signal. This IS the intended "Nervous System" behaviour.
        // Developers who want component-local signals must pass an explicit unique ID:
        //   useSignal(0, 'counter-a-count')
        if (t.isIdentifier(callee) && callee.name === 'useSignal') {
          if (babelPath.node.arguments.length < 2) {
            // Resolve variable name from the declarator: const count = useSignal(0)
            // Falls back to 'signal' for unusual patterns (no declarator, destructuring).
            const parent = babelPath.parent;
            const varName =
              t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)
                ? parent.id.name
                : 'signal';

            babelPath.node.arguments.push(t.stringLiteral(varName));
            console.log(`[Bose Optimizer] Injected signal ID: "${varName}"`);
          }
          return; // nothing more to do for useSignal
        }

        const isBoseMarker = t.isIdentifier(callee) && callee.name === '$';
        const isServerMarker = t.isIdentifier(callee) && callee.name === 'server$';

        if (isBoseMarker) {
          const innerFunction = babelPath.node.arguments[0];

          if (!t.isFunction(innerFunction)) {
            throw babelPath.buildCodeFrameError('The $( ) marker must contain a function.');
          }

          // 1. Analyze Scope: Identify variables used from outside
          const usedVariables = new Set();
          const signalsList = new Set();
          const innerFunctionPath = babelPath.get('arguments.0');

          innerFunctionPath.traverse({
            Identifier(idPath) {
              if (idPath.isReferencedIdentifier()) {
                const name = idPath.node.name;
                const binding = idPath.scope.getBinding(name);

                if (binding && !innerFunctionPath.scope.hasOwnBinding(name)) {
                  usedVariables.add(name);

                  const parentPath = binding.path;
                  if (
                    parentPath.isVariableDeclarator() &&
                    t.isCallExpression(parentPath.node.init) &&
                    parentPath.node.init.callee.name === 'useSignal'
                  ) {
                    signalsList.add(name);
                  }
                }
              }
            }
          });

          const variablesList = Array.from(usedVariables);
          const signalsArray = Array.from(signalsList);
          console.log(`[Bose Optimizer] Captured variables:`, variablesList, 'Signals:', signalsArray);

          // 2. Regenerate function source from AST (safe — not affected by prior transforms)
          const fnSource = nodeToCode(innerFunction);

          // 3. Deterministic chunk ID: hash of file path + function source + captured vars
          //    Same source in same file always produces the same chunk filename across builds.
          const hashInput = `${state.filename}:${fnSource}:${variablesList.join(',')}`;
          const chunkId = `chunk_${contentHash(hashInput)}`;
          const chunkFilename = `${chunkId}.js`;

          // 4. Build chunk content using the safely-regenerated function source.
          //    Server action variables (from server$()) cannot be serialized to JSON, so
          //    they are never stored in bose:state. Instead, inline the fetch call directly
          //    using the known actionId — no state needed, works in every browser chunk.
          const stateVars = variablesList.filter(v => !state.serverActionVars.has(v));
          const destructuring = variablesList.map(v => {
            if (state.serverActionVars.has(v)) {
              const actionId = state.serverActionVars.get(v);
              return `const ${v} = async (...args) => fetch('/_bose_action', { method: 'POST', body: JSON.stringify({ id: '${actionId}', args }) }).then(r => r.json());`;
            }
            if (signalsList.has(v)) {
              return `const ${v} = new Signal(state.${v}, '${v}');`;
            }
            return `const ${v} = state.${v};`;
          }).join('\n  ');

          const chunkContent = [
            `/** BOSE GENERATED CHUNK: ${chunkId} **/`,
            `import { Signal } from '@bosejs/state';`,
            ``,
            `export default function(state, element, event) {`,
            `  ${destructuring}`,
            `  const logic = ${fnSource};`,
            `  logic(event);`,
            `  return {`,
            `    ${signalsArray.map(s => `${s}: ${s}.value`).join(',\n    ')}`,
            `  };`,
            `}`,
          ].join('\n');

          // 5. Hand chunk off — either to the Vite collector or directly to disk.
          //    chunkCollector is a Map provided by vite-plugin.js during its transform hook.
          //    When present, the Vite plugin decides how to emit (emitFile vs fs.write).
          //    When absent (standalone / test usage), fall back to writing to disk.
          const outputDir = state.opts.outputDir || 'dist/chunks';
          if (state.opts.chunkCollector) {
            state.opts.chunkCollector.set(chunkFilename, chunkContent);
          } else {
            writeToDisk(outputDir, chunkFilename, chunkContent);
          }

          // 6. Replace $(...) with a plain descriptor object the renderer can use.
          //    Only include state-serializable vars in props — server actions are inlined
          //    directly in the chunk and must not appear in bose:state.
          const chunkPath = `chunks/${chunkFilename}`;
          babelPath.replaceWith(t.objectExpression([
            t.objectProperty(t.identifier('chunk'), t.stringLiteral(chunkPath)),
            t.objectProperty(t.identifier('props'), t.arrayExpression(stateVars.map(v => t.stringLiteral(v)))),
            t.objectProperty(t.identifier('signals'), t.arrayExpression(signalsArray.map(v => t.stringLiteral(v))))
          ]));
        }

        // Detect server$( ... )
        if (isServerMarker) {
          const serverFunction = babelPath.node.arguments[0];
          if (!t.isFunction(serverFunction)) {
            throw babelPath.buildCodeFrameError('server$( ) must contain a function.');
          }

          // Deterministic action ID: hash of file path + server function source
          const fnSource = nodeToCode(serverFunction);
          const actionId = `action_${contentHash(`${state.filename}:${fnSource}`)}`;
          console.log(`[Bose Optimizer] Registered Server Action: ${actionId}`);

          // Hand the server function source to the Vite plugin so the dev-server
          // middleware can actually execute it when /_bose_action is called.
          // The emitted module is a plain ESM file: `export default <fn>;`
          if (state.opts.actionCollector) {
            state.opts.actionCollector.set(actionId, `export default ${fnSource};\n`);
          }

          // Record variable name → actionId so $() chunks can inline the RPC
          // call instead of trying to read it from bose:state (functions aren't
          // JSON-serializable, so state-based capture silently produces undefined).
          const parentNode = babelPath.parentPath && babelPath.parentPath.node;
          if (parentNode && t.isVariableDeclarator(parentNode) && t.isIdentifier(parentNode.id)) {
            state.serverActionVars.set(parentNode.id.name, actionId);
          }

          babelPath.replaceWith(t.arrowFunctionExpression(
            [t.restElement(t.identifier('args'))],
            t.callExpression(
              t.memberExpression(
                t.callExpression(t.identifier('fetch'), [
                  t.stringLiteral('/_bose_action'),
                  t.objectExpression([
                    t.objectProperty(t.identifier('method'), t.stringLiteral('POST')),
                    t.objectProperty(t.identifier('body'), t.callExpression(
                      t.memberExpression(t.identifier('JSON'), t.identifier('stringify')),
                      [t.objectExpression([
                        t.objectProperty(t.identifier('id'), t.stringLiteral(actionId)),
                        t.objectProperty(t.identifier('args'), t.identifier('args'))
                      ])]
                    ))
                  ])
                ]),
                t.identifier('then')
              ),
              [t.arrowFunctionExpression(
                [t.identifier('r')],
                t.callExpression(t.memberExpression(t.identifier('r'), t.identifier('json')), [])
              )]
            ),
            true // async
          ));
          babelPath.node.async = true;
          return;
        }

        // Detect css$( ... )
        if (t.isIdentifier(callee) && callee.name === 'css$') {
          const cssArg = babelPath.get('arguments.0');
          let rawCss = '';

          if (t.isStringLiteral(cssArg.node)) {
            rawCss = cssArg.node.value;
          } else if (t.isTemplateLiteral(cssArg.node)) {
            rawCss = cssArg.node.quasis.map(q => q.value.raw).join('');
          } else {
            throw babelPath.buildCodeFrameError('css$( ) must contain a string literal or template literal.');
          }

          // Deterministic scope ID: hash of file path + raw CSS content
          // Short prefix keeps class names readable; hash prevents collisions.
          const scopeId = `b${contentHash(`${state.filename}:${rawCss}`).slice(0, 6)}`;

          const classRegex = /\.([a-zA-Z_][a-zA-Z0-9_-]*)/g;
          const scopedCss = rawCss.replace(classRegex, `.$1-${scopeId}`);

          // Store in per-file collection (set up by pre() hook).
          // The post() hook commits this to global.__BOSE_STYLE_MAP__.
          state.boseStyles.push(scopedCss);

          const classMatches = Array.from(rawCss.matchAll(classRegex));
          const mappingProperties = classMatches.map(match => {
            const className = match[1];
            return t.objectProperty(
              t.stringLiteral(className),
              t.stringLiteral(`${className}-${scopeId}`)
            );
          });

          babelPath.replaceWith(t.objectExpression(mappingProperties));
        }
      }
    }
  };
}
