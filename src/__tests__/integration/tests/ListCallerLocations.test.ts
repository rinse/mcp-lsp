import { isRight } from 'fp-ts/Either';

import { testRunners, TestRunner } from '../TestRunner';

describe('ListCallerLocations Integration Test', () => {
  const runners: [string, TestRunner][] = testRunners.map(([name, init]) => [name, init()]);

  beforeAll(async () => {
    const promises = runners.map(([, runner]) => runner.init());
    await Promise.all(promises);
  });

  afterAll(async () => {
    const promises = runners.map(([, runner]) => runner.close());
    await Promise.all(promises);
  });

  test.each(runners)('[%s] should find callers of function with multiple callers', async (name, runner) => {
    const result = await runner.runTool('list_caller_locations_of', {
      uri: 'src/__tests__/integration/test-subjects/CallHierarchy.ts',
      line: 65, // Line with multipleCallerTarget definition
      character: 16, // Character position on multipleCallerTarget
    });
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for list_caller_locations_of');
      } else {
        expect(result.right).toContain('callers');
      }
    }
  }, 15000);
});
