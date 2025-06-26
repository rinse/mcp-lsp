import { isRight } from 'fp-ts/Either';

import { setupIntegrationTest, expectFoundResult, expectFilePathInResult } from '../utils/testSetup';

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
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for list_symbol_references');
      } else {
        expectFoundResult(result.right, 6);
        expectFilePathInResult(result.right, 'References.ts');
        // References output contains positions but not symbol names
        // Should include both the declaration and all usage sites
        expect(result.right.split('\n').length).toBeGreaterThan(1);
      }
    }
  }, 15000);

  test.each(runners)('[%s] should find references excluding declaration', async (name, runner) => {
    const result = await runner.runTool('list_symbol_references', {
      uri: 'src/__tests__/integration/test-subjects/References.ts',
      line: 6, // Line with testReferencedFunction definition
      character: 16, // Character position on testReferencedFunction
      includeDeclaration: false,
    });
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for list_symbol_references');
      } else {
        expectFoundResult(result.right, 5);
        expectFilePathInResult(result.right, 'References.ts');
        // References output contains positions but not symbol names
        // Should exclude the declaration, so fewer references than the include test
        expect(result.right.split('\n').length).toBeGreaterThan(1);
      }
    }
  }, 15000);

  test.each(runners)('[%s] should find references from usage point', async (name, runner) => {
    const result = await runner.runTool('list_symbol_references', {
      uri: 'src/__tests__/integration/test-subjects/References.ts',
      line: 27, // Line with testReferencedFunction usage
      character: 19, // Character position on testReferencedFunction
      includeDeclaration: true,
    });
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for list_symbol_references');
      } else {
        expectFoundResult(result.right, 6);
        expectFilePathInResult(result.right, 'References.ts');
        // References output contains positions but not symbol names
        // Should find all references including the declaration when called from usage
        expect(result.right.split('\n').length).toBeGreaterThan(1);
      }
    }
  }, 15000);
});
