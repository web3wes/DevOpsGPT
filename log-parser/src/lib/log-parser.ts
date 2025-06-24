import type { FailureContext, TestFailure, BuildError } from '@devopsgpt/types';

/**
 * Very simple heuristics to extract failures from CI logs.
 * Supports Jest test failures and generic stack traces.
 */
export function parseFailureLog(params: {
  repo: string;
  buildId: string;
  logContent: string;
}): FailureContext {
  const { repo, buildId, logContent } = params;

  const failedTests: TestFailure[] = [];
  const buildErrors: BuildError[] = [];

  // Regex for Jest failure blocks
  const jestTestRegex = /● (.+) › (.+)\n\s*(.+)\n/gm;
  let match: RegExpExecArray | null;
  while ((match = jestTestRegex.exec(logContent)) !== null) {
    const [, filePath, testName, message] = match;
    failedTests.push({ filePath, testName, message });
  }

  // Generic error/stack trace capture
  const errorLines = logContent.split('\n').filter((l) => l.startsWith('Error:'));
  errorLines.forEach((line) => {
    buildErrors.push({ message: line });
  });

  return {
    repo,
    buildId,
    failedTests,
    buildErrors,
  };
}
