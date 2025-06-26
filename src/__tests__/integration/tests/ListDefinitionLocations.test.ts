import { isRight } from 'fp-ts/Either';

import { setupIntegrationTest, expectFoundResult, expectFilePathInResult } from '../utils/testSetup';

describe('ListDefinitionLocations Integration Test', () => {
  const testSetup = setupIntegrationTest();
  const runners = testSetup.runners;

  beforeAll(async () => await testSetup.beforeAllSetup());
  afterAll(async () => await testSetup.afterAllTeardown());

  test.each(runners)('[%s] should find definition location for function', async (name, runner) => {
    const result = await runner.runTool('list_definition_locations', {
      uri: 'src/__tests__/integration/test-subjects/Definitions.ts',
      line: 41, // Line with testDefinitionFunction usage
      character: 21, // Character position on testDefinitionFunction
    });
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for list_definition_locations');
      } else {
        expectFoundResult(result.right, 1);
        expectFilePathInResult(result.right, 'Definitions.ts');
        // Definition output contains positions but not symbol names
      }
    }
  }, 15000);

  test.each(runners)('[%s] should find definition location for class', async (name, runner) => {
    const result = await runner.runTool('list_definition_locations', {
      uri: 'src/__tests__/integration/test-subjects/Definitions.ts',
      line: 42, // Line with TestDefinitionClass usage
      character: 23, // Character position on TestDefinitionClass
    });
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for list_definition_locations');
      } else {
        expectFoundResult(result.right, 1);
        expectFilePathInResult(result.right, 'Definitions.ts');
        // Definition output contains positions but not symbol names
      }
    }
  }, 15000);

  test.each(runners)('[%s] should find definition location for property', async (name, runner) => {
    const result = await runner.runTool('list_definition_locations', {
      uri: 'src/__tests__/integration/test-subjects/Definitions.ts',
      line: 43, // Line with testProperty usage
      character: 33, // Character position on testProperty
    });
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for list_definition_locations');
      } else {
        expectFoundResult(result.right, 1);
        expectFilePathInResult(result.right, 'Definitions.ts');
        // Definition output contains positions but not symbol names
      }
    }
  }, 15000);

  test.each(runners)('[%s] should find definition location for method', async (name, runner) => {
    const result = await runner.runTool('list_definition_locations', {
      uri: 'src/__tests__/integration/test-subjects/Definitions.ts',
      line: 44, // Line with testMethod usage
      character: 31, // Character position on testMethod
    });
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for list_definition_locations');
      } else {
        expectFoundResult(result.right, 1);
        expectFilePathInResult(result.right, 'Definitions.ts');
        // Definition output contains positions but not symbol names
      }
    }
  }, 15000);
});
