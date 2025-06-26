import { isRight } from 'fp-ts/Either';

import { setupIntegrationTest } from '../utils/testSetup';

describe('ListImplementationLocations Integration Test', () => {
  const testSetup = setupIntegrationTest();
  const runners = testSetup.runners;

  beforeAll(async () => await testSetup.beforeAllSetup());
  afterAll(async () => await testSetup.afterAllTeardown());

  test.each(runners)('[%s] should find interface implementations', async (name, runner) => {
    const result = await runner.runTool('list_implementation_locations', {
      uri: 'src/__tests__/integration/test-subjects/Implementations.ts',
      line: 6, // Line with TestImplementationInterface definition
      character: 17, // Character position on TestImplementationInterface
    });
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(
        'Found 2 implementations:\n' +
        '/src/__tests__/integration/test-subjects/Implementations.ts:14:13-14:32\n' +
        '/src/__tests__/integration/test-subjects/Implementations.ts:27:13-27:32',
      );
    }
  }, 15000);

  test.each(runners)('[%s] should find abstract class implementations', async (name, runner) => {
    const result = await runner.runTool('list_implementation_locations', {
      uri: 'src/__tests__/integration/test-subjects/Implementations.ts',
      line: 40, // Line with TestAbstractClass definition
      character: 22, // Character position on TestAbstractClass
    });
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(
        'Found 2 implementations:\n' +
        '/src/__tests__/integration/test-subjects/Implementations.ts:40:22-40:39\n' +
        '/src/__tests__/integration/test-subjects/Implementations.ts:51:13-51:30',
      );
    }
  }, 15000);

  test.each(runners)('[%s] should find interface implementations from usage', async (name, runner) => {
    const result = await runner.runTool('list_implementation_locations', {
      uri: 'src/__tests__/integration/test-subjects/Implementations.ts',
      line: 59, // Line with TestImplementationInterface usage
      character: 17, // Character position on TestImplementationInterface
    });
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(
        'Found 2 implementations:\n' +
        '/src/__tests__/integration/test-subjects/Implementations.ts:14:13-14:32\n' +
        '/src/__tests__/integration/test-subjects/Implementations.ts:27:13-27:32',
      );
    }
  }, 15000);
});
