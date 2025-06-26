import { either } from 'fp-ts';

import { setupIntegrationTest } from '../utils/testSetup';

describe('ListCallerLocations Integration Test', () => {
  const testSetup = setupIntegrationTest();
  const runners = testSetup.runners;

  beforeAll(async () => await testSetup.beforeAllSetup());
  afterAll(async () => await testSetup.afterAllTeardown());

  test.each(runners)('[%s] should find callers of function with multiple callers', async (name, runner) => {
    const result = await runner.runTool('list_caller_locations_of', {
      uri: 'src/__tests__/integration/test-subjects/CallHierarchy.ts',
      line: 65, // Line with multipleCallerTarget definition
      character: 16, // Character position on multipleCallerTarget
    });
    expect(result).toEqual(either.right(
      'No callers found for symbol at src/__tests__/integration/test-subjects/CallHierarchy.ts:65:16',
    ));
  }, 10000);
});
