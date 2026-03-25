/**
 * BOSE COMPILER ERRORS
 * Structured error class with error codes, human-readable hints, and doc links.
 *
 * Usage:
 *   throw new BoseCompilerError('BOSE_E001', 'The $( ) marker must contain a function.', {
 *     suggestion: 'Wrap your handler body in an arrow function: $(() => { ... })',
 *     loc: { line: 12, column: 4, filename: 'src/pages/index.js' }
 *   });
 */

const DOCS_BASE = 'https://bosejs.dev/docs/errors';

export const ERROR_CODES = {
  /** $() marker does not contain a function */
  BOSE_E001: 'BOSE_E001',
  /** server$() marker does not contain a function */
  BOSE_E002: 'BOSE_E002',
  /** css$() argument is not a string or template literal */
  BOSE_E003: 'BOSE_E003',
  /** Generic/unclassified compiler error */
  BOSE_E000: 'BOSE_E000',
};

const DEFAULT_SUGGESTIONS = {
  BOSE_E001: 'Wrap your event-handler logic in an arrow function: $(() => { ... })',
  BOSE_E002: 'Wrap your server function body in an arrow function: server$(() => { ... })',
  BOSE_E003: 'Pass a plain string or template literal: css$(`.my-class { color: red; }`)',
  BOSE_E000: 'Check the Bose documentation for guidance on this error.',
};

export class BoseCompilerError extends Error {
  /**
   * @param {keyof typeof ERROR_CODES} code
   * @param {string} message — concise description of what went wrong
   * @param {{ suggestion?: string, loc?: { line?: number, column?: number, filename?: string } }} [options]
   */
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'BoseCompilerError';
    this.code = code in ERROR_CODES ? code : ERROR_CODES.BOSE_E000;
    this.suggestion = options.suggestion ?? DEFAULT_SUGGESTIONS[this.code] ?? '';
    this.docsUrl = `${DOCS_BASE}#${this.code.toLowerCase()}`;
    this.loc = options.loc ?? null;
  }

  toString() {
    const lines = [
      `[${this.code}] ${this.message}`,
    ];
    if (this.loc) {
      const { filename, line, column } = this.loc;
      const parts = [filename, line != null ? `line ${line}` : null, column != null ? `col ${column}` : null]
        .filter(Boolean).join(', ');
      if (parts) lines.push(`  Location: ${parts}`);
    }
    if (this.suggestion) lines.push(`  Suggestion: ${this.suggestion}`);
    lines.push(`  Docs: ${this.docsUrl}`);
    return lines.join('\n');
  }
}

/**
 * Convenience: wrap a Babel path's buildCodeFrameError output in a BoseCompilerError,
 * preserving the code frame string as the message.
 *
 * @param {import('@babel/traverse').NodePath} babelPath
 * @param {keyof typeof ERROR_CODES} code
 * @param {string} message
 * @param {{ suggestion?: string }} [options]
 * @returns {BoseCompilerError}
 */
export function buildBoseError(babelPath, code, message, options = {}) {
  // buildCodeFrameError gives us the source-frame context in the message.
  const frameError = babelPath.buildCodeFrameError(message);
  const loc = babelPath.node.loc
    ? {
        line: babelPath.node.loc.start.line,
        column: babelPath.node.loc.start.column,
        filename: babelPath.hub && babelPath.hub.file && babelPath.hub.file.opts.filename,
      }
    : null;
  return new BoseCompilerError(code, frameError.message, { ...options, loc });
}
