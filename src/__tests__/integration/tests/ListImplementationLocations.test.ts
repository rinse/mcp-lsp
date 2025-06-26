import { isRight } from 'fp-ts/Either';

import { setupIntegrationTest, expectFoundResult, expectFilePathInResult } from '../utils/testSetup';

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
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for list_implementation_locations');
      } else {
        expectFoundResult(result.right, 2);
        expectFilePathInResult(result.right, 'Implementations.ts');
        // Implementation output contains positions but not class names
      }
    }
  }, 15000);

  test.each(runners)('[%s] should find abstract class implementations', async (name, runner) => {
    const result = await runner.runTool('list_implementation_locations', {
      uri: 'src/__tests__/integration/test-subjects/Implementations.ts',
      line: 40, // Line with TestAbstractClass definition
      character: 22, // Character position on TestAbstractClass
    });
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for list_implementation_locations');
      } else {
        expectFoundResult(result.right, 2);
        expectFilePathInResult(result.right, 'Implementations.ts');
        // Implementation output contains positions but not class names
      }
    }
  }, 15000);

  test.each(runners)('[%s] should find interface implementations from usage', async (name, runner) => {
    const result = await runner.runTool('list_implementation_locations', {
      uri: 'src/__tests__/integration/test-subjects/Implementations.ts',
      line: 59, // Line with TestImplementationInterface usage
      character: 17, // Character position on TestImplementationInterface
    });
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for list_implementation_locations');
      } else {
        expectFoundResult(result.right, 2);
        expectFilePathInResult(result.right, 'Implementations.ts');
        // Implementation output contains positions but not class names
      }
    }
  }, 15000);
});
