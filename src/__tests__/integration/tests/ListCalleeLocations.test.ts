import { isRight } from 'fp-ts/Either';

import { testRunners, TestRunner } from '../TestRunner';

describe('ListCalleeLocations Integration Test', () => {
  const runners: [string, TestRunner][] = testRunners.map(([name, init]) => [name, init()]);

  beforeAll(async () => {
    const promises = runners.map(([, runner]) => runner.init());
    await Promise.all(promises);
  });

  afterAll(async () => {
    const promises = runners.map(([, runner]) => runner.close());
    await Promise.all(promises);
  });

  test.each(runners)('[%s] should find callees of function with multiple calls', async (name, runner) => {
    const result = await runner.runTool('list_callee_locations_in', {
      uri: 'src/__tests__/integration/test-subjects/CallHierarchy.ts',
      line: 14, // Line with midLevelFunction definition
      character: 16, // Character position on midLevelFunction
    });
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for list_callee_locations_in');
      } else {
        expect(result.right).toContain('callees');
      }
    }
  }, 15000);
});
