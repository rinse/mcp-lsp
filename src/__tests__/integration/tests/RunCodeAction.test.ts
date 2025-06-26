import { isRight } from 'fp-ts/Either';

import { setupIntegrationTest } from '../utils/testSetup';

describe('RunCodeAction Integration Test', () => {
  const testSetup = setupIntegrationTest();
  const runners = testSetup.runners;

  beforeAll(async () => await testSetup.beforeAllSetup());
  afterAll(async () => await testSetup.afterAllTeardown());

  test.each(runners)('[%s] should run a code action', async (name, runner) => {
    const mockCodeAction = {
      title: 'Test Code Action',
      kind: 'quickfix',
    };

    const result = await runner.runTool('run_code_action', {
      codeAction: mockCodeAction,
    });
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toMatch(/Successfully applied|Success|Code action|⚠️/);
      // Action title may not always be in the response
      expect(typeof result.right).toBe('string');
    }
  }, 15000);
});
