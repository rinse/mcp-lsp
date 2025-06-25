import { isRight } from 'fp-ts/Either';

import { testRunners, TestRunner } from '../TestRunner';

describe('ListImplementationLocations Integration Test', () => {
  const runners: [string, TestRunner][] = testRunners.map(([name, init]) => [name, init()]);

  beforeAll(async () => {
    const promises = runners.map(([, runner]) => runner.init());
    await Promise.all(promises);
  });

  afterAll(async () => {
    const promises = runners.map(([, runner]) => runner.close());
    await Promise.all(promises);
  });

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
        // Should find both implementations of the interface
        expect(result.right).toBe('Found 2 implementations:\n/src/__tests__/integration/test-subjects/Implementations.ts:14:13-14:32\n/src/__tests__/integration/test-subjects/Implementations.ts:27:13-27:32');
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
        // Should find both the abstract class and its concrete implementation
        expect(result.right).toBe('Found 2 implementations:\n/src/__tests__/integration/test-subjects/Implementations.ts:40:22-40:39\n/src/__tests__/integration/test-subjects/Implementations.ts:51:13-51:30');
      }
    }
  }, 15000);

  test.each(runners)('[%s] should find interface implementations from usage', async (name, runner) => {
    const result = await runner.runTool('list_implementation_locations', {
      uri: 'src/__tests__/integration/test-subjects/Implementations.ts',
      line: 58, // Line with TestImplementationInterface usage
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
        // Should find both implementations of the interface
        expect(result.right).toBe('Found 2 implementations:\n/src/__tests__/integration/test-subjects/Implementations.ts:14:13-14:32\n/src/__tests__/integration/test-subjects/Implementations.ts:27:13-27:32');
      }
    }
  }, 15000);
});
