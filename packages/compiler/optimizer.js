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
        if (babelPath.node.callee.name === '$') {
          const innerFunction = babelPath.node.arguments[0];
          
          if (!t.isFunction(innerFunction)) {
            throw babelPath.buildCodeFrameError('The $( ) marker must contain a function.');
          }

          // 1. Analyze Scope: Identify variables used from outside
          const usedVariables = new Set();
          const innerFunctionPath = babelPath.get('arguments.0');
          
          innerFunctionPath.traverse({
            Identifier(idPath) {
              if (idPath.isReferencedIdentifier()) {
                const name = idPath.node.name;
                // Important: Check if the binding exists and is NOT defined within the innerFunction scope
                const binding = idPath.scope.getBinding(name);
                
                // If there's a binding and it's defined outside our innerFunction, it's a "captured" variable
                if (binding && !innerFunctionPath.scope.hasOwnBinding(name)) {
                  usedVariables.add(name);
                }
              }
            }
          });

          const variablesList = Array.from(usedVariables);
          console.log(`[Bose Optimizer] Captured variables for chunk:`, variablesList);

          // 2. Generate Unique ID
          const chunkId = `chunk_${Math.random().toString(36).substr(2, 9)}`;
          const chunkFilename = `${chunkId}.js`;
          
          // 3. Save Chunk with "Destructured State"
          // We map the captured variables from the 'state' object passed to the chunk
          const destructuring = variablesList.length > 0 
            ? `const { ${variablesList.join(', ')} } = state;` 
            : '';

          const chunkContent = `
/** BOSE GENERATED CHUNK: ${chunkId} **/
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
          // This tells the loader WHICH variables it needs to serialize into HTML
          babelPath.replaceWith(t.objectExpression([
            t.objectProperty(t.identifier('chunk'), t.stringLiteral(chunkFilename)),
            t.objectProperty(t.identifier('props'), t.arrayExpression(variablesList.map(v => t.stringLiteral(v))))
          ]));
        }
      }
    }
  };
};
