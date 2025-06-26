import { isRight } from 'fp-ts/Either';

import { setupIntegrationTest, expectFilePathInResult } from '../utils/testSetup';

describe('ListCalleeLocations Integration Test', () => {
  const testSetup = setupIntegrationTest();
  const runners = testSetup.runners;

  beforeAll(async () => await testSetup.beforeAllSetup());
  afterAll(async () => await testSetup.afterAllTeardown());

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
        expectFilePathInResult(result.right, 'CallHierarchy.ts');
        expect(result.right).toContain('callee');
        expect(result.right).toContain('helperFunction');
      }
    }
  }, 15000);
});
