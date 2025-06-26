import { isRight } from 'fp-ts/Either';

import { setupIntegrationTest } from '../utils/testSetup';

describe('ListDefinitionLocations Integration Test', () => {
  const testSetup = setupIntegrationTest();
  const runners = testSetup.runners;

  beforeAll(async () => await testSetup.beforeAllSetup());
  afterAll(async () => await testSetup.afterAllTeardown());

  test.each(runners)('[%s] should find definition location for function', async (name, runner) => {
    const result = await runner.runTool('list_definition_locations', {
      uri: 'src/__tests__/integration/test-subjects/Definitions.ts',
      line: 42, // Line with testDefinitionFunction usage
      character: 21, // Character position on testDefinitionFunction
    });
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(
        'Found 1 definitions:\n' +
        '/src/__tests__/integration/test-subjects/Definitions.ts:6:16-6:38',
      );
    }
  }, 10000);

  test.each(runners)('[%s] should find definition location for class', async (name, runner) => {
    const result = await runner.runTool('list_definition_locations', {
      uri: 'src/__tests__/integration/test-subjects/Definitions.ts',
      line: 42, // Line with TestDefinitionClass usage
      character: 23, // Character position on TestDefinitionClass
    });
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(
        'Found 1 definitions:\n' +
        '/src/__tests__/integration/test-subjects/Definitions.ts:6:16-6:38',
      );
    }
  }, 10000);

  test.each(runners)('[%s] should find definition location for property', async (name, runner) => {
    const result = await runner.runTool('list_definition_locations', {
      uri: 'src/__tests__/integration/test-subjects/Definitions.ts',
      line: 43, // Line with testProperty usage
      character: 33, // Character position on testProperty
    });
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(
        'Found 1 definitions:\n' +
        '/src/__tests__/integration/test-subjects/Definitions.ts:18:13-18:32',
      );
    }
  }, 10000);

  test.each(runners)('[%s] should find definition location for method', async (name, runner) => {
    const result = await runner.runTool('list_definition_locations', {
      uri: 'src/__tests__/integration/test-subjects/Definitions.ts',
      line: 47, // Line with testMethod usage
      character: 31, // Character position on testMethod
    });
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(
        'Found 1 definitions:\n' +
        '/src/__tests__/integration/test-subjects/Definitions.ts:27:9-27:19',
      );
    }
  }, 10000);
});
