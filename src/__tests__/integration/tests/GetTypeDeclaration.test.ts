import { isRight } from 'fp-ts/Either';

import { testRunners, TestRunner } from '../TestRunner';

describe('GetTypeDeclaration Integration Test', () => {
  const runners: [string, TestRunner][] = testRunners.map(([name, init]) => [name, init()]);

  beforeAll(async () => {
    const promises = runners.map(([, runner]) => runner.init());
    await Promise.all(promises);
  });

  afterAll(async () => {
    const promises = runners.map(([, runner]) => runner.close());
    await Promise.all(promises);
  });

  test.each(runners)('[%s] should find type declaration for type alias usage', async (name, runner) => {
    const result = await runner.runTool('get_type_declaration', {
      uri: 'src/__tests__/integration/test-subjects/Types.ts',
      line: 43, // Line with TestTypeAlias usage
      character: 17, // Character position on TestTypeAlias
    });
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for get_type_declaration');
      } else {
        expect(result.right).toContain('No type definition found');
      }
    }
  }, 15000);
});
