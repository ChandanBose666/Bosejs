/**
 * @bosejs/compiler — Structured compiler error types.
 */

/** All recognised Bose compiler error codes. */
export declare const ERROR_CODES: {
  readonly BOSE_E000: 'BOSE_E000';
  readonly BOSE_E001: 'BOSE_E001';
  readonly BOSE_E002: 'BOSE_E002';
  readonly BOSE_E003: 'BOSE_E003';
};

export type BoseErrorCode = keyof typeof ERROR_CODES;

/** Source location attached to a `BoseCompilerError`. */
export interface BoseErrorLoc {
  line?: number;
  column?: number;
  filename?: string;
}

/**
 * Structured error thrown by the Bose compiler (Babel plugin) when it
 * encounters invalid usage of `$()`, `server$()`, or `css$()`.
 *
 * Properties are intended for consumption by editor integrations, build
 * error overlays, and test assertions.
 *
 * @example
 * import { BoseCompilerError } from '@bosejs/compiler/errors';
 *
 * try {
 *   babel.transformSync(code, { plugins: [boseOptimizer] });
 * } catch (e) {
 *   if (e instanceof BoseCompilerError) {
 *     console.error(e.code, e.suggestion, e.docsUrl);
 *   }
 * }
 */
export declare class BoseCompilerError extends Error {
  /** Stable error code — use for programmatic handling. */
  readonly code: BoseErrorCode;

  /**
   * Human-readable fix suggestion.
   * Populated from `options.suggestion` or a built-in default for the code.
   */
  readonly suggestion: string;

  /** URL to the documentation page for this error code. */
  readonly docsUrl: string;

  /** Source location of the offending node, if available. */
  readonly loc: BoseErrorLoc | null;

  constructor(
    code: BoseErrorCode,
    message: string,
    options?: { suggestion?: string; loc?: BoseErrorLoc }
  );

  /** Formats `code`, location, suggestion, and docs URL into one string. */
  toString(): string;
}

/**
 * Build a `BoseCompilerError` from a Babel `NodePath`, preserving the
 * source-code frame in the message.
 *
 * @param babelPath — the Babel `NodePath` of the offending node
 * @param code      — Bose error code
 * @param message   — short description of the problem
 * @param options   — optional suggestion override
 */
export declare function buildBoseError(
  babelPath: import('@babel/traverse').NodePath,
  code: BoseErrorCode,
  message: string,
  options?: { suggestion?: string }
): BoseCompilerError;
