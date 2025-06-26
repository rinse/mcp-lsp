import { either } from 'fp-ts';

import { setupIntegrationTest } from '../utils/testSetup';

describe('ListSymbolReferences Integration Test', () => {
  const testSetup = setupIntegrationTest();
  const runners = testSetup.runners;

  beforeAll(async () => await testSetup.beforeAllSetup());
  afterAll(async () => await testSetup.afterAllTeardown());

  test.each(runners)('[%s] should find all references including declaration', async (name, runner) => {
    const result = await runner.runTool('list_symbol_references', {
      uri: 'src/__tests__/integration/test-subjects/References.ts',
      line: 6, // Line with testReferencedFunction definition
      character: 16, // Character position on testReferencedFunction
      includeDeclaration: true,
    });
    expect(result).toEqual(either.right(
      'Found 6 references:\n' +
      '/src/__tests__/integration/test-subjects/References.ts:6:16-6:38\n' +
      '/src/__tests__/integration/test-subjects/References.ts:22:11-22:33\n' +
      '/src/__tests__/integration/test-subjects/References.ts:28:19-28:41\n' +
      '/src/__tests__/integration/test-subjects/References.ts:30:19-30:41\n' +
      '/src/__tests__/integration/test-subjects/References.ts:41:14-41:36\n' +
      '/src/__tests__/integration/test-subjects/References.ts:51:9-51:31',
    ));
  }, 10000);

  test.each(runners)('[%s] should find references excluding declaration', async (name, runner) => {
    const result = await runner.runTool('list_symbol_references', {
      uri: 'src/__tests__/integration/test-subjects/References.ts',
      line: 6, // Line with testReferencedFunction definition
      character: 16, // Character position on testReferencedFunction
      includeDeclaration: false,
    });
    expect(result).toEqual(either.right(
      'Found 5 references:\n' +
      '/src/__tests__/integration/test-subjects/References.ts:22:11-22:33\n' +
      '/src/__tests__/integration/test-subjects/References.ts:28:19-28:41\n' +
      '/src/__tests__/integration/test-subjects/References.ts:30:19-30:41\n' +
      '/src/__tests__/integration/test-subjects/References.ts:41:14-41:36\n' +
      '/src/__tests__/integration/test-subjects/References.ts:51:9-51:31',
    ));
  }, 10000);

  test.each(runners)('[%s] should find references from usage point', async (name, runner) => {
    const result = await runner.runTool('list_symbol_references', {
      uri: 'src/__tests__/integration/test-subjects/References.ts',
      line: 28, // Line with testReferencedFunction usage
      character: 19, // Character position on testReferencedFunction
      includeDeclaration: true,
    });
    expect(result).toEqual(either.right(
      'Found 6 references:\n' +
      '/src/__tests__/integration/test-subjects/References.ts:6:16-6:38\n' +
      '/src/__tests__/integration/test-subjects/References.ts:22:11-22:33\n' +
      '/src/__tests__/integration/test-subjects/References.ts:28:19-28:41\n' +
      '/src/__tests__/integration/test-subjects/References.ts:30:19-30:41\n' +
      '/src/__tests__/integration/test-subjects/References.ts:41:14-41:36\n' +
      '/src/__tests__/integration/test-subjects/References.ts:51:9-51:31',
    ));
  }, 10000);
});
