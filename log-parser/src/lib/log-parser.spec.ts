import { parseFailureLog } from './log-parser.js';

describe('parseFailureLog', () => {
  const sampleLog = `FAIL  src/utils/__tests__/math.spec.ts
  ● math › adds numbers
    expect(received).toBe(expected) // Object.is equality
    
    Expected: 4
    Received: 5

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 total
Snapshots:   0 total
Time:        1.123 s
Error: Process completed with exit code 1.`;

  it('extracts jest failure', () => {
    const ctx = parseFailureLog({
      repo: 'demo',
      buildId: '123',
      logContent: sampleLog,
    });

    expect(ctx.failedTests.length).toBe(1);
    expect(ctx.failedTests[0].testName).toContain('adds numbers');
    expect(ctx.buildErrors.length).toBeGreaterThan(0);
  });
});
