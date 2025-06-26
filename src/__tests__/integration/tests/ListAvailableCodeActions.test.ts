import { isRight } from 'fp-ts/Either';

import { setupIntegrationTest, expectFilePathInResult } from '../utils/testSetup';

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
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for list_available_code_actions');
      } else {
        expectFilePathInResult(result.right, 'CodeActions.ts');
        expect(result.right).toContain('code action');
        expect(result.right).toContain('Infer function return type');
      }
    }
  }, 15000);
});
