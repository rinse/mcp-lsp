import { isRight } from 'fp-ts/Either';

import { testRunners, TestRunner } from '../TestRunner';

describe('ListDefinitionLocations Integration Test', () => {
  const runners: [string, TestRunner][] = testRunners.map(([name, init]) => [name, init()]);

  beforeAll(async () => {
    const promises = runners.map(([, runner]) => runner.init());
    await Promise.all(promises);
  });

  afterAll(async () => {
    const promises = runners.map(([, runner]) => runner.close());
    await Promise.all(promises);
  });

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
        // Should find the definition at the function declaration
        expect(result.right).toBe('Found 1 definitions:\n/src/__tests__/integration/test-subjects/Definitions.ts:6:16-6:38');
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
        // Should find the definition at the class declaration
        expect(result.right).toBe('Found 1 definitions:\n/src/__tests__/integration/test-subjects/Definitions.ts:18:13-18:32');
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
        // Should find the definition at the property declaration
        expect(result.right).toBe('Found 1 definitions:\n/src/__tests__/integration/test-subjects/Definitions.ts:22:9-22:21');
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
        // Should find the definition at the method declaration
        expect(result.right).toBe('Found 1 definitions:\n/src/__tests__/integration/test-subjects/Definitions.ts:27:9-27:19');
      }
    }
  }, 15000);
});
