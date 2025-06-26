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
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for run_code_action');
      } else {
        expect(result.right).toContain('Test Code Action');
        expect(result.right).toContain('action');
      }
    }
  }, 15000);
});
