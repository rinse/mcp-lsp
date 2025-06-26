import { either } from 'fp-ts';

import { setupIntegrationTest } from '../utils/testSetup';

describe('ListAvailableCodeActions Integration Test', () => {
  const testSetup = setupIntegrationTest();
  const runners = testSetup.runners;

  beforeAll(async () => await testSetup.beforeAllSetup());
  afterAll(async () => await testSetup.afterAllTeardown());

  test.each(runners)('[%s] should find available code actions for function with issues', async (name, runner) => {
    const result = await runner.runTool('list_available_code_actions', {
      uri: 'src/__tests__/integration/test-subjects/CodeActions.ts',
      line: 81, // Line with functionWithCodeActionOpportunities that has multiple issues
      character: 16, // Character position on function name
      endLine: 81,
      endCharacter: 50,
    });
    expect(result).toEqual(either.right(
      'Found 3 code action(s):\n\n' +
      '1. Move to a new file (refactor.move)\n' +
      '   📋 For executeCodeAction tool:\n' +
      '{\n' +
      '  "title": "Move to a new file",\n' +
      '  "kind": "refactor.move",\n' +
      '  "command": {\n' +
      '    "title": "Move to a new file",\n' +
      '    "command": "_typescript.applyRefactoring",\n' +
      '    "arguments": [\n' +
      '      {\n' +
      '        "file": "/src/__tests__/integration/test-subjects/CodeActions.ts",\n' +
      '        "startLine": 82,\n' +
      '        "startOffset": 17,\n' +
      '        "endLine": 82,\n' +
      '        "endOffset": 51,\n' +
      '        "refactor": "Move to a new file",\n' +
      '        "action": "Move to a new file"\n' +
      '      }\n' +
      '    ]\n' +
      '  }\n' +
      '}\n' +
      '   ⚡ Command: Move to a new file (_typescript.applyRefactoring)\n\n' +
      '2. Convert parameters to destructured object (refactor)\n' +
      '   📋 For executeCodeAction tool:\n' +
      '{\n' +
      '  "title": "Convert parameters to destructured object",\n' +
      '  "kind": "refactor",\n' +
      '  "command": {\n' +
      '    "title": "Convert parameters to destructured object",\n' +
      '    "command": "_typescript.applyRefactoring",\n' +
      '    "arguments": [\n' +
      '      {\n' +
      '        "file": "/src/__tests__/integration/test-subjects/CodeActions.ts",\n' +
      '        "startLine": 82,\n' +
      '        "startOffset": 17,\n' +
      '        "endLine": 82,\n' +
      '        "endOffset": 51,\n' +
      '        "refactor": "Convert parameters to destructured object",\n' +
      '        "action": "Convert parameters to destructured object"\n' +
      '      }\n' +
      '    ]\n' +
      '  }\n' +
      '}\n' +
      '   ⚡ Command: Convert parameters to destructured object (_typescript.applyRefactoring)\n\n' +
      '3. Infer function return type (refactor)\n' +
      '   📋 For executeCodeAction tool:\n' +
      '{\n' +
      '  "title": "Infer function return type",\n' +
      '  "kind": "refactor",\n' +
      '  "command": {\n' +
      '    "title": "Infer function return type",\n' +
      '    "command": "_typescript.applyRefactoring",\n' +
      '    "arguments": [\n' +
      '      {\n' +
      '        "file": "/src/__tests__/integration/test-subjects/CodeActions.ts",\n' +
      '        "startLine": 82,\n' +
      '        "startOffset": 17,\n' +
      '        "endLine": 82,\n' +
      '        "endOffset": 51,\n' +
      '        "refactor": "Infer function return type",\n' +
      '        "action": "Infer function return type"\n' +
      '      }\n' +
      '    ]\n' +
      '  }\n' +
      '}\n' +
      '   ⚡ Command: Infer function return type (_typescript.applyRefactoring)',
    ));
  }, 10000);

  test.each(runners)('[%s] should find code actions for another function', async (name, runner) => {
    const result = await runner.runTool('list_available_code_actions', {
      uri: 'src/__tests__/integration/test-subjects/CodeActions.ts',
      line: 14, // Line with another function
      character: 16, // Character position
      endLine: 14,
      endCharacter: 45,
    });
    expect(result).toEqual(either.right(
      'Found 1 code action(s):\n\n' +
      '1. Move to a new file (refactor.move)\n' +
      '   📋 For executeCodeAction tool:\n' +
      '{\n' +
      '  "title": "Move to a new file",\n' +
      '  "kind": "refactor.move",\n' +
      '  "command": {\n' +
      '    "title": "Move to a new file",\n' +
      '    "command": "_typescript.applyRefactoring",\n' +
      '    "arguments": [\n' +
      '      {\n' +
      '        "file": "/src/__tests__/integration/test-subjects/CodeActions.ts",\n' +
      '        "startLine": 15,\n' +
      '        "startOffset": 17,\n' +
      '        "endLine": 15,\n' +
      '        "endOffset": 46,\n' +
      '        "refactor": "Move to a new file",\n' +
      '        "action": "Move to a new file"\n' +
      '      }\n' +
      '    ]\n' +
      '  }\n' +
      '}\n' +
      '   ⚡ Command: Move to a new file (_typescript.applyRefactoring)',
    ));
  }, 10000);
});
