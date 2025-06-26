import { isRight } from 'fp-ts/Either';

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
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toMatch(/Found \d+/);
      expect(result.right).toContain('References.ts');
    }
  }, 15000);

  test.each(runners)('[%s] should find references excluding declaration', async (name, runner) => {
    const result = await runner.runTool('list_symbol_references', {
      uri: 'src/__tests__/integration/test-subjects/References.ts',
      line: 6, // Line with testReferencedFunction definition
      character: 16, // Character position on testReferencedFunction
      includeDeclaration: false,
    });
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toMatch(/Found \d+/);
      expect(result.right).toContain('References.ts');
    }
  }, 15000);

  test.each(runners)('[%s] should find references from usage point', async (name, runner) => {
    const result = await runner.runTool('list_symbol_references', {
      uri: 'src/__tests__/integration/test-subjects/References.ts',
      line: 28, // Line with testReferencedFunction usage
      character: 19, // Character position on testReferencedFunction
      includeDeclaration: true,
    });
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toMatch(/Found \d+/);
      expect(result.right).toContain('References.ts');
    }
  }, 15000);
});
