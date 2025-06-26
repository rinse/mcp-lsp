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

