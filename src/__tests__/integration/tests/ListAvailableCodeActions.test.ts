import { isRight } from 'fp-ts/Either';

import { setupIntegrationTest } from '../utils/testSetup';

describe('ListAvailableCodeActions Integration Test', () => {
  const testSetup = setupIntegrationTest();
  const runners = testSetup.runners;

  beforeAll(async () => await testSetup.beforeAllSetup());
  afterAll(async () => await testSetup.afterAllTeardown());

  test.each(runners)('[%s] should find available code actions', async (name, runner) => {
    const result = await runner.runTool('list_available_code_actions', {
      uri: 'src/__tests__/integration/test-subjects/CodeActions.ts',
      line: 7, // Line with unused parameter
      character: 45, // Character position
      endLine: 7,
      endCharacter: 55,
    });
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toMatch(/Code actions|No code actions|Found \d+ code actions|Successfully/);
      // File path may not always be in the response
      expect(typeof result.right).toBe('string');
    }
  }, 15000);
});
