import { promises as fs } from 'fs';
import path from 'path';

import { isRight } from 'fp-ts/Either';

import { setupIntegrationTest } from '../utils/testSetup';

describe('RefactorRenameSymbol Integration Test', () => {
  const testSetup = setupIntegrationTest();
  const runners = testSetup.runners;

  // Temporary file paths
  const tempDir = path.join(process.cwd(), 'src/__tests__/integration/temp-rename-test');
  const mainFile = path.join(tempDir, 'RenameMain.ts');
  const usageFile = path.join(tempDir, 'RenameUsage.ts');

  beforeAll(async () => await testSetup.beforeAllSetup());
  afterAll(async () => await testSetup.afterAllTeardown());

  beforeEach(async () => {
    // Create temporary directory and test files
    await fs.mkdir(tempDir, { recursive: true });

    // Create main file with symbols to rename
    await fs.writeFile(mainFile, `export function targetFunction(param: string): string {
  return 'Hello ' + param;
}

export const TARGET_CONSTANT = 42;

export class TargetClass {
  method(): void {
    console.log('test');
  }
}
`);

    // Create usage file that imports and uses the symbols
    await fs.writeFile(usageFile, `import { targetFunction, TARGET_CONSTANT, TargetClass } from './RenameMain';

export function useTargets(): void {
  const result = targetFunction('world');
  const value = TARGET_CONSTANT * 2;
  const instance = new TargetClass();
  instance.method();
}
`);
  });

  afterEach(async () => {
    // Clean up temporary files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Failed to cleanup temp directory:', error);
    }
  });

  test.each(runners)('[%s] should rename function across multiple files', async (name, runner) => {
    const result = await runner.runTool('refactor_rename_symbol', {
      uri: mainFile,
      line: 0, // targetFunction definition
      character: 16,
      newName: 'renamedFunction',
    });

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toContain('Successfully renamed symbol to "renamedFunction"');

      const mainContent = await fs.readFile(mainFile, 'utf-8');
      expect(mainContent).toBe(`export function renamedFunction(param: string): string {
  return 'Hello ' + param;
}

export const TARGET_CONSTANT = 42;

export class TargetClass {
  method(): void {
    console.log('test');
  }
}
`);
    }
  }, 10000);

  test.each(runners)('[%s] should rename constant across files', async (name, runner) => {
    const result = await runner.runTool('refactor_rename_symbol', {
      uri: mainFile,
      line: 4, // TARGET_CONSTANT definition
      character: 13,
      newName: 'RENAMED_CONSTANT',
    });

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toContain('Successfully renamed symbol to "RENAMED_CONSTANT"');

      const mainContent = await fs.readFile(mainFile, 'utf-8');
      expect(mainContent).toBe(`export function targetFunction(param: string): string {
  return 'Hello ' + param;
}

export const RENAMED_CONSTANT = 42;

export class TargetClass {
  method(): void {
    console.log('test');
  }
}
`);
    }
  }, 10000);

  test.each(runners)('[%s] should rename class across files', async (name, runner) => {
    const result = await runner.runTool('refactor_rename_symbol', {
      uri: mainFile,
      line: 6, // TargetClass definition
      character: 13,
      newName: 'RenamedClass',
    });

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toContain('Successfully renamed symbol to "RenamedClass"');

      const mainContent = await fs.readFile(mainFile, 'utf-8');
      expect(mainContent).toBe(`export function targetFunction(param: string): string {
  return 'Hello ' + param;
}

export const TARGET_CONSTANT = 42;

export class RenamedClass {
  method(): void {
    console.log('test');
  }
}
`);
    }
  }, 10000);

  test.each(runners)('[%s] should allow invalid identifier names', async (name, runner) => {
    const result = await runner.runTool('refactor_rename_symbol', {
      uri: mainFile,
      line: 0,
      character: 16,
      newName: '123invalid', // Invalid identifier
    });

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      // TypeScript LSP allows invalid identifiers
      expect(result.right).toBe('Successfully renamed symbol to "123invalid"');
    }
  }, 10000);

  test.each(runners)('[%s] should allow TypeScript keywords', async (name, runner) => {
    const result = await runner.runTool('refactor_rename_symbol', {
      uri: mainFile,
      line: 0,
      character: 16,
      newName: 'function', // Reserved keyword
    });

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      // TypeScript LSP allows reserved keywords
      expect(result.right).toBe('Successfully renamed symbol to "function"');
    }
  }, 10000);

  test.each(runners)('[%s] should handle non-existent files', async (name, runner) => {
    const result = await runner.runTool('refactor_rename_symbol', {
      uri: 'src/__tests__/integration/test-subjects/NonExistent.ts',
      line: 0,
      character: 16,
      newName: 'newName',
    });

    expect(isRight(result)).toBe(false);
    if (!isRight(result)) {
      expect(result.left).toBe(
        "Failed to run tool refactor_rename_symbol: McpError: MCP error -32603: MCP error -32603: Failed to rename symbol: Error: ENOENT: no such file or directory, open 'src/__tests__/integration/test-subjects/NonExistent.ts'",
      );
    }
  }, 10000);
});
