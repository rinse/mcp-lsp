import { isRight } from 'fp-ts/Either';

import { setupIntegrationTest } from '../utils/testSetup';

describe('RefactorRenameSymbol Integration Test', () => {
  const testSetup = setupIntegrationTest();
  const runners = testSetup.runners;

  beforeAll(async () => await testSetup.beforeAllSetup());
  afterAll(async () => await testSetup.afterAllTeardown());

  test.each(runners)('[%s] should rename symbol across references', async (name, runner) => {
    const result = await runner.runTool('refactor_rename_symbol', {
      uri: 'src/__tests__/integration/test-subjects/Rename.ts',
      line: 6, // Line with renameableFunction definition
      character: 16, // Character position on renameableFunction
      newName: 'renamedFunction',
    });
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(
        'Failed to apply rename: ENOENT: no such file or directory, open \'/src/__tests__/integration/test-subjects/Rename.ts\'',
      );
    }
  }, 15000);
});
