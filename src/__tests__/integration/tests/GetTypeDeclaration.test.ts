import { isRight } from 'fp-ts/Either';

import { setupIntegrationTest } from '../utils/testSetup';

describe('GetTypeDeclaration Integration Test', () => {
  const testSetup = setupIntegrationTest();
  const runners = testSetup.runners;

  beforeAll(async () => await testSetup.beforeAllSetup());
  afterAll(async () => await testSetup.afterAllTeardown());

  test.each(runners)('[%s] should find type declaration for type alias usage', async (name, runner) => {
    const result = await runner.runTool('get_type_declaration', {
      uri: 'src/__tests__/integration/test-subjects/Types.ts',
      line: 74, // Line with TestTypeAlias usage in variable declaration
      character: 20, // Character position on TestTypeAlias
    });

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(
        'Found 1 type definitions:\n' +
        '/src/__tests__/integration/test-subjects/Types.ts:6:17-6:30',
      );
    }
  }, 10000);

  test.each(runners)('[%s] should find type declaration for interface usage', async (name, runner) => {
    const result = await runner.runTool('get_type_declaration', {
      uri: 'src/__tests__/integration/test-subjects/Types.ts',
      line: 22, // Line with TestTypeAlias usage in interface
      character: 8, // Character position on TestTypeAlias
    });

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(
        'Found 1 type definitions:\n' +
        '/src/__tests__/integration/test-subjects/Types.ts:6:17-6:30',
      );
    }
  }, 10000);

  test.each(runners)('[%s] should find type declaration for generic type usage', async (name, runner) => {
    const result = await runner.runTool('get_type_declaration', {
      uri: 'src/__tests__/integration/test-subjects/Types.ts',
      line: 31, // Line with TestTypeAlias usage in generic type
      character: 12, // Character position on TestTypeAlias
    });

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(
        'Found 1 type definitions:\n' +
        '/src/__tests__/integration/test-subjects/Types.ts:6:17-6:30',
      );
    }
  }, 10000);

  test.each(runners)('[%s] should handle enum type declaration', async (name, runner) => {
    const result = await runner.runTool('get_type_declaration', {
      uri: 'src/__tests__/integration/test-subjects/Types.ts',
      line: 61, // Line with TestEnum usage
      character: 25, // Character position on TestEnum
    });

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(
        'Found 1 type definitions:\n' +
        '/src/__tests__/integration/test-subjects/Types.ts:37:12-37:20',
      );
    }
  }, 10000);
});
