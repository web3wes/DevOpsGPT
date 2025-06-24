export interface TestFailure {
  filePath: string;
  testName: string;
  message: string;
  stack?: string;
}

export interface BuildError {
  message: string;
  stack?: string;
}

export interface FailureContext {
  repo: string;
  buildId: string;
  failedTests: TestFailure[];
  buildErrors: BuildError[];
} 