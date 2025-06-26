import { promises as fs } from 'fs';
import path from 'path';

import { either } from 'fp-ts';

import { CodeAction } from '../../../lsp/types/CodeActionRequest';
import { setupIntegrationTest } from '../utils/testSetup';

describe('RunCodeAction Integration Test', () => {
  const testSetup = setupIntegrationTest();
  const runners = testSetup.runners;

  // Temporary file paths
  const tempDir = path.join(process.cwd(), 'src/__tests__/integration/temp-code-action-test');
  const testFile = path.join(tempDir, 'CodeActionTest.ts');

  beforeAll(async () => await testSetup.beforeAllSetup());
  afterAll(async () => await testSetup.afterAllTeardown());

  beforeEach(async () => {
    // Create temporary directory and test file
    await fs.mkdir(tempDir, { recursive: true });

    // Create a test file with code that needs fixing
    const fileContent = `// Test file for code actions
export function calculateSum(a: number, b: number) {
  return a + b;
}

export function processData(data: any[]) {
  const result = data.map(item => item.value);
  return result;
}

// Function with unused parameter
export function functionWithUnusedParam(unused: string, used: number): number {
  return used * 2;
}
`;
    await fs.writeFile(testFile, fileContent);
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

  test.each(runners)('[%s] should infer function return type', async (name, runner) => {
    // Extract the "Infer function return type" action from the result
    const codeAction = {
      title: "Infer function return type",
      kind: "refactor",
      command: {
        title: "Infer function return type",
        command: "_typescript.applyRefactoring",
        arguments: [
          {
            file: "src/__tests__/integration/temp-code-action-test/CodeActionTest.ts",
            startLine: 2,
            startOffset: 17,
            endLine: 2,
            endOffset: 29,
            refactor: "Infer function return type",
            action: "Infer function return type",
          },
        ],
      },
    } satisfies CodeAction;

    // Run the code action
    const result = await runner.runTool('run_code_action', {
      codeAction: codeAction,
    });

    expect(result).toEqual(either.right(
      "✅ Successfully executed command \"_typescript.applyRefactoring\" for \"Infer function return type\"",
    ));
  }, 10000);

  test.each(runners)('[%s] should convert parameters to destructured object', async (name, runner) => {
    // First, get available code actions
    const codeAction = {
      title: "Convert parameters to destructured object",
      kind: "refactor",
      command: {
        title: "Convert parameters to destructured object",
        command: "_typescript.applyRefactoring",
        arguments: [
          {
            file: "src/__tests__/integration/temp-code-action-test/CodeActionTest.ts",
            startLine: 2,
            startOffset: 17,
            endLine: 2,
            endOffset: 29,
            refactor: "Convert parameters to destructured object",
            action: "Convert parameters to destructured object",
          },
        ],
      },
    } satisfies CodeAction;

    // Run the code action
    const result = await runner.runTool('run_code_action', {
      codeAction: codeAction,
    });

    expect(result).toEqual(
      either.right("✅ Successfully executed command \"_typescript.applyRefactoring\" for \"Convert parameters to destructured object\""),
    );
  }, 10000);

  test.each(runners)('[%s] should handle code action without edit or command', async (name, runner) => {
    const mockCodeAction = {
      title: 'Test Code Action',
      kind: 'quickfix',
    };

    const result = await runner.runTool('run_code_action', {
      codeAction: mockCodeAction,
    });

    expect(result).toEqual(
      either.right('⚠️ Code action "Test Code Action" has no WorkspaceEdit or Command to execute'),
    );
  }, 10000);
});
