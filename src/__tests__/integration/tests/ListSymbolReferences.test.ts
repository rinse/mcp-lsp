import { isRight } from 'fp-ts/Either';

import { testRunners, TestRunner } from '../TestRunner';

describe('ListSymbolReferences Integration Test', () => {
  const runners: [string, TestRunner][] = testRunners.map(([name, init]) => [name, init()]);

  beforeAll(async () => {
    const promises = runners.map(([, runner]) => runner.init());
    await Promise.all(promises);
  });

  afterAll(async () => {
    const promises = runners.map(([, runner]) => runner.close());
    await Promise.all(promises);
  });

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
        // Should find all 6 references including the declaration
        expect(result.right).toBe('Found 6 references:\n/src/__tests__/integration/test-subjects/References.ts:6:16-6:38\n/src/__tests__/integration/test-subjects/References.ts:22:11-22:33\n/src/__tests__/integration/test-subjects/References.ts:27:19-27:41\n/src/__tests__/integration/test-subjects/References.ts:28:19-28:41\n/src/__tests__/integration/test-subjects/References.ts:37:14-37:36\n/src/__tests__/integration/test-subjects/References.ts:47:9-47:31');
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
        // Should find 5 references excluding the declaration
        expect(result.right).toBe('Found 5 references:\n/src/__tests__/integration/test-subjects/References.ts:22:11-22:33\n/src/__tests__/integration/test-subjects/References.ts:27:19-27:41\n/src/__tests__/integration/test-subjects/References.ts:28:19-28:41\n/src/__tests__/integration/test-subjects/References.ts:37:14-37:36\n/src/__tests__/integration/test-subjects/References.ts:47:9-47:31');
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
        // Should find all 6 references including the declaration
        expect(result.right).toBe('Found 6 references:\n/src/__tests__/integration/test-subjects/References.ts:6:16-6:38\n/src/__tests__/integration/test-subjects/References.ts:22:11-22:33\n/src/__tests__/integration/test-subjects/References.ts:27:19-27:41\n/src/__tests__/integration/test-subjects/References.ts:28:19-28:41\n/src/__tests__/integration/test-subjects/References.ts:37:14-37:36\n/src/__tests__/integration/test-subjects/References.ts:47:9-47:31');
      }
    }
  }, 15000);
});
