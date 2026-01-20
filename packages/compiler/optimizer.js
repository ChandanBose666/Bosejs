const t = require('@babel/types');
const fs = require('fs');
const path = require('path');

/**
 * BOSE OPTIMIZER
 * 1. Finds all instances of $( ... )
 * 2. Extracts the inner function to a new file.
 * 3. Replaces the $( ... ) with the chunk reference.
 */
module.exports = function boseOptimizer() {
  return {
    name: 'bose-optimizer',
    visitor: {
      Program(babelPath, state) {
        if (state.filename.includes('Hero.js') || state.filename.includes('index.md')) {
          console.log(`[Bose Optimizer] Processing: ${state.filename}`);
        }
      },
      CallExpression(babelPath, state) {
        const { callee } = babelPath.node;
        
        // Safety check for identifier name
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
                  
                  // Detect if this variable was initialized with useSignal
                  const parentPath = binding.path;
                  if (parentPath.isVariableDeclarator() && 
                      t.isCallExpression(parentPath.node.init) && 
                      parentPath.node.init.callee.name === 'useSignal') {
                    signalsList.add(name);
                  }
                }
              }
            }
          });

          const variablesList = Array.from(usedVariables);
          const signalsArray = Array.from(signalsList);
          console.log(`[Bose Optimizer] Captured variables:`, variablesList, 'Signals:', signalsArray);

          // 2. Generate Unique ID
          const chunkId = `chunk_${Math.random().toString(36).substr(2, 9)}`;
          const chunkFilename = `${chunkId}.js`;
          
          // 3. Save Chunk with "Destructured State"
          // If it's a signal, we need to re-wrap it into a Signal object for reactivity
          const destructuring = variablesList.map(v => {
            if (signalsList.has(v)) {
              return `const ${v} = new Signal(state.${v}, '${v}');`;
            }
            return `const ${v} = state.${v};`;
          }).join('\n  ');

          const chunkContent = `
/** BOSE GENERATED CHUNK: ${chunkId} **/
import { Signal } from '@bose/state';

export default function(state, element) {
  ${destructuring}
  const logic = ${state.file.code.slice(innerFunction.start, innerFunction.end)};
  logic(state, element);
  return {
    ${signalsArray.map(s => `${s}: ${s}.value`).join(',\n    ')}
  };
}
          `;
          
          const outputDir = state.opts.outputDir || 'dist/chunks';
          if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
          fs.writeFileSync(path.join(outputDir, chunkFilename), chunkContent);

          // 4. Replace with Object containing chunk info and state keys
          // Include 'chunks/' prefix so the runtime can load it correctly
          const chunkPath = `chunks/${chunkFilename}`;
          babelPath.replaceWith(t.objectExpression([
            t.objectProperty(t.identifier('chunk'), t.stringLiteral(chunkPath)),
            t.objectProperty(t.identifier('props'), t.arrayExpression(variablesList.map(v => t.stringLiteral(v)))),
            t.objectProperty(t.identifier('signals'), t.arrayExpression(signalsArray.map(v => t.stringLiteral(v))))
          ]));
        }

        // Detect server$( ... )
        if (isServerMarker) {
          const serverFunction = babelPath.node.arguments[0];
          if (!t.isFunction(serverFunction)) {
             throw babelPath.buildCodeFrameError('server$( ) must contain a function.');
          }

          const actionId = `action_${Math.random().toString(36).substr(2, 9)}`;
          console.log(`[Bose Optimizer] Registered Server Action: ${actionId}`);
          
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
              [t.arrowFunctionExpression([t.identifier('r')], t.callExpression(t.memberExpression(t.identifier('r'), t.identifier('json')), []))]
            ),
            true // async
          ));
          babelPath.node.async = true;
          return; // Stop here to avoid processing as other markers
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
          
          const scopeId = `bose_${Date.now().toString(36).slice(-6)}`;
          
          // Improved Regex: Must start with a lette/underscore/hyphen, and only match if it's a class selector
          const classRegex = /\.([a-zA-Z_][a-zA-Z0-9_-]*)/g;
          const scopedCss = rawCss.replace(classRegex, `.$1-${scopeId}`);
          
          if (!global.__BOSE_STYLES__) global.__BOSE_STYLES__ = [];
          global.__BOSE_STYLES__.push(scopedCss);

          // Use the same regex to find classes for mapping
          const classMatches = Array.from(rawCss.matchAll(classRegex));
          const mappingProperties = classMatches.map(match => {
            const className = match[1];
            // Use stringLiteral for the key to safely handle hyphens like 'btn-primary'
            return t.objectProperty(t.stringLiteral(className), t.stringLiteral(`${className}-${scopeId}`));
          });

          babelPath.replaceWith(t.objectExpression(mappingProperties));
        }
      }
    }
  };
};
