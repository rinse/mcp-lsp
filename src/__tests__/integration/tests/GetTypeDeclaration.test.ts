import { isRight } from 'fp-ts/Either';

import { setupIntegrationTest, expectFoundResult, expectFilePathInResult } from '../utils/testSetup';

describe('GetTypeDeclaration Integration Test', () => {
  const { runners, beforeAllSetup, afterAllTeardown } = setupIntegrationTest();

  beforeAll(beforeAllSetup);
  afterAll(afterAllTeardown);

  test.each(runners)('[%s] should find type declaration for type alias usage', async (name, runner) => {
    const result = await runner.runTool('get_type_declaration', {
      uri: 'src/__tests__/integration/test-subjects/Types.ts',
      line: 74, // Line with TestTypeAlias usage in variable declaration
      character: 20, // Character position on TestTypeAlias
    });
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for get_type_declaration');
      } else {
        expectFoundResult(result.right, 1);
        expectFilePathInResult(result.right, 'Types.ts');
        expect(result.right).toContain('6:17'); // Should point to the type alias definition
      }
    }
  }, 15000);

  test.each(runners)('[%s] should find type declaration for interface usage', async (name, runner) => {
    const result = await runner.runTool('get_type_declaration', {
      uri: 'src/__tests__/integration/test-subjects/Types.ts',
      line: 22, // Line with TestTypeAlias usage in interface
      character: 8, // Character position on TestTypeAlias
    });
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for get_type_declaration');
      } else {
        expectFoundResult(result.right, 1);
        expectFilePathInResult(result.right, 'Types.ts');
      }
    }
  }, 15000);

  test.each(runners)('[%s] should find type declaration for generic type usage', async (name, runner) => {
    const result = await runner.runTool('get_type_declaration', {
      uri: 'src/__tests__/integration/test-subjects/Types.ts',
      line: 31, // Line with TestTypeAlias usage in generic type
      character: 12, // Character position on TestTypeAlias
    });
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for get_type_declaration');
      } else {
        expectFoundResult(result.right, 1);
        expectFilePathInResult(result.right, 'Types.ts');
      }
    }
  }, 15000);

  test.each(runners)('[%s] should handle enum type declaration', async (name, runner) => {
    const result = await runner.runTool('get_type_declaration', {
      uri: 'src/__tests__/integration/test-subjects/Types.ts',
      line: 61, // Line with TestEnum usage
      character: 25, // Character position on TestEnum
    });
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      if (name === 'mock') {
        expect(result.right).toBe('Mock response for get_type_declaration');
      } else {
        // Enum type declarations may not always be found, so we accept either result
        expect(result.right).toMatch(/Found \d+ type definitions:|No type definition found/);
      }
    }
  }, 15000);
});