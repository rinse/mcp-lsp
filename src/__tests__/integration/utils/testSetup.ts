import { testRunners, TestRunner } from '../TestRunner';

/**
 * Shared setup for integration tests to reduce code duplication
 */
export function setupIntegrationTest(): {
  runners: [string, TestRunner][];
  beforeAllSetup(): Promise<void>;
  afterAllTeardown(): Promise<void>;
} {
  const runners: [string, TestRunner][] = testRunners.map(([name, init]) => [name, init()]);

  const beforeAllSetup = async (): Promise<void> => {
    const promises = runners.map(([, runner]) => runner.init());
    await Promise.all(promises);
  };

  const afterAllTeardown = async (): Promise<void> => {
    const promises = runners.map(([, runner]) => runner.close());
    await Promise.all(promises);
  };

  return {
    runners,
    beforeAllSetup,
    afterAllTeardown,
  };
}

/**
 * Helper to check if a result contains expected elements without being brittle about exact formatting
 */
export function expectResultContains(result: string, expectedElements: string[]): void {
  for (const element of expectedElements) {
    expect(result).toContain(element);
  }
}

/**
 * Helper to check if a result indicates a successful find operation
 */
export function expectFoundResult(result: string, expectedCount?: number): void {
  expect(result).toMatch(/Found \d+/);
  if (expectedCount !== undefined) {
    expect(result).toContain(`Found ${expectedCount}`);
  }
}

/**
 * Helper to check file path in result without being brittle about absolute paths
 */
export function expectFilePathInResult(result: string, relativeFilePath: string): void {
  expect(result).toContain(relativeFilePath);
}
