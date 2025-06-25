import { isRight } from 'fp-ts/Either';

import { testRunners, TestRunner } from '../TestRunner';

describe('RefactorRenameSymbol Integration Test', () => {
  const runners: [string, TestRunner][] = testRunners.map(([name, init]) => [name, init()]);

  beforeAll(async () => {
    const promises = runners.map(([, runner]) => runner.init());
    await Promise.all(promises);
  });

  afterAll(async () => {
    const promises = runners.map(([, runner]) => runner.close());
    await Promise.all(promises);
  });

  test.each(runners)('[%s] should rename symbol across references', async (name, runner) => {
    const result = await runner.runTool('refactor_rename_symbol', {
      uri: 'src/__tests__/integration/test-subjects/Rename.ts',
      line: 6, // Line with renameableFunction definition
      character: 16, // Character position on renameableFunction
      newName: 'renamedFunction',
    });
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for refactor_rename_symbol');
      } else {
        expect(result.right).toContain('Failed to apply rename');
      }
    }
  }, 15000);
});
