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
  return logic(state, element);
}
          `;
          
          const outputDir = state.opts.outputDir || 'dist/chunks';
          if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
          fs.writeFileSync(path.join(outputDir, chunkFilename), chunkContent);

          // 4. Replace with Object containing chunk info and state keys
          babelPath.replaceWith(t.objectExpression([
            t.objectProperty(t.identifier('chunk'), t.stringLiteral(chunkFilename)),
            t.objectProperty(t.identifier('props'), t.arrayExpression(variablesList.map(v => t.stringLiteral(v)))),
            t.objectProperty(t.identifier('signals'), t.arrayExpression(signalsArray.map(v => t.stringLiteral(v))))
          ]));
        }

        // NEW: Detect server$( ... )
        if (isServerMarker) {
          const serverFunction = babelPath.node.arguments[0];
          if (!t.isFunction(serverFunction)) {
             throw babelPath.buildCodeFrameError('server$( ) must contain a function.');
          }

          // 1. Generate a stable Action ID
          const actionId = `action_${Math.random().toString(36).substr(2, 9)}`;
          
          // 2. Register the action for the server (In a real app, this goes to a manifest)
          console.log(`[Bose Optimizer] Registered Server Action: ${actionId}`);
          
          // 3. Replace server$(...) with an RPC call
          // For PoC, we inline the fetch call. In production, this would be a runtime helper.
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
        }
      }
    }
  };
};
