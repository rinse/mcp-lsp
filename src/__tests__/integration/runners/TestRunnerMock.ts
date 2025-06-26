import { promises as fs } from 'fs';

import { Either, left, right } from 'fp-ts/Either';

import { TestRunner } from '../TestRunner';

export class TestRunnerMock implements TestRunner {
  listTools(): Promise<Either<string, string>> {
    const toolList = `Available tools:
get_hover_info
list_definition_locations
list_implementation_locations
list_symbol_references
get_type_declaration
refactor_rename_symbol
list_available_code_actions
run_code_action
list_caller_locations_of
list_callee_locations_in`;
    return Promise.resolve(right(toolList));
  }


  async runTool(toolName: string, args: Record<string, unknown>): Promise<Either<string, string>> {
    switch (toolName) {
      case 'get_hover_info':
        return Promise.resolve(right('src/__tests__/integration/test-subjects/GetHoverInfo.ts:13:16\n  Type: function exampleFunction(): void\n  Docs: This is an example function for testing hover info'));
      case 'list_definition_locations': {
        const line = args.line as number;
        const character = args.character as number;
        switch (`${line}:${character}`) {
          case '42:21': // testDefinitionFunction usage
            return Promise.resolve(right('Found 1 definitions:\n/src/__tests__/integration/test-subjects/Definitions.ts:6:16-6:38'));
          case '42:23': // TestDefinitionClass usage
            return Promise.resolve(right('Found 1 definitions:\n/src/__tests__/integration/test-subjects/Definitions.ts:6:16-6:38'));
          case '43:33': // testProperty usage
            return Promise.resolve(right('Found 1 definitions:\n/src/__tests__/integration/test-subjects/Definitions.ts:18:13-18:32'));
          case '47:31': // testMethod usage
            return Promise.resolve(right('Found 1 definitions:\n/src/__tests__/integration/test-subjects/Definitions.ts:27:9-27:19'));
          default:
            throw new Error(`Unexpected line:character for list_definition_locations: ${line}:${character}`);
        }
      }
      case 'list_implementation_locations': {
        const line = args.line as number;
        const character = args.character as number;
        switch (`${line}:${character}`) {
          case '6:17': // Interface definition
          case '59:17': // Interface usage
            return Promise.resolve(right('Found 2 implementations:\n/src/__tests__/integration/test-subjects/Implementations.ts:14:13-14:32\n/src/__tests__/integration/test-subjects/Implementations.ts:27:13-27:32'));
          case '40:22': // Abstract class definition
            return Promise.resolve(right('Found 2 implementations:\n/src/__tests__/integration/test-subjects/Implementations.ts:40:22-40:39\n/src/__tests__/integration/test-subjects/Implementations.ts:51:13-51:30'));
          default:
            throw new Error(`Unexpected line:character for list_implementation_locations: ${line}:${character}`);
        }
      }
      case 'list_symbol_references': {
        const includeDeclaration = args.includeDeclaration as boolean;
        if (includeDeclaration === false) {
          return Promise.resolve(right('Found 5 references:\n/src/__tests__/integration/test-subjects/References.ts:22:11-22:33\n/src/__tests__/integration/test-subjects/References.ts:28:19-28:41\n/src/__tests__/integration/test-subjects/References.ts:30:19-30:41\n/src/__tests__/integration/test-subjects/References.ts:41:14-41:36\n/src/__tests__/integration/test-subjects/References.ts:51:9-51:31'));
        } else {
          return Promise.resolve(right('Found 6 references:\n/src/__tests__/integration/test-subjects/References.ts:6:16-6:38\n/src/__tests__/integration/test-subjects/References.ts:22:11-22:33\n/src/__tests__/integration/test-subjects/References.ts:28:19-28:41\n/src/__tests__/integration/test-subjects/References.ts:30:19-30:41\n/src/__tests__/integration/test-subjects/References.ts:41:14-41:36\n/src/__tests__/integration/test-subjects/References.ts:51:9-51:31'));
        }
      }
      case 'get_type_declaration': {
        const line = args.line as number;
        switch (line) {
          case 74: // TestTypeAlias usage in variable declaration
            return Promise.resolve(right('Found 1 type definitions:\n/src/__tests__/integration/test-subjects/Types.ts:6:17-6:30'));
          case 22: // TestTypeAlias usage in interface
            return Promise.resolve(right('Found 1 type definitions:\n/src/__tests__/integration/test-subjects/Types.ts:6:17-6:30'));
          case 31: // TestTypeAlias usage in generic type
            return Promise.resolve(right('Found 1 type definitions:\n/src/__tests__/integration/test-subjects/Types.ts:6:17-6:30'));
          case 61: // TestEnum usage
            return Promise.resolve(right('Found 1 type definitions:\n/src/__tests__/integration/test-subjects/Types.ts:37:12-37:20'));
          default:
            throw new Error(`Unexpected line number for get_type_declaration: ${line}`);
        }
      }
      case 'refactor_rename_symbol': {
        const uri = args.uri as string;
        const newName = args.newName as string;
        const line = args.line as number;

        // Check if it's a temp test file
        if (uri.includes('temp-rename-test')) {
          // No validation - TypeScript LSP allows any identifier (matching MCP client behavior)

          // Write new file content based on which symbol is being renamed
          let newContent: string;

          switch (line) {
            case 0: // targetFunction at line 0
              newContent = `export function ${newName}(param: string): string {
  return 'Hello ' + param;
}

export const TARGET_CONSTANT = 42;

export class TargetClass {
  method(): void {
    console.log('test');
  }
}
`;
              break;

            case 4: // TARGET_CONSTANT at line 4
              newContent = `export function targetFunction(param: string): string {
  return 'Hello ' + param;
}

export const ${newName} = 42;

export class TargetClass {
  method(): void {
    console.log('test');
  }
}
`;
              break;

            case 6: // TargetClass at line 6
              newContent = `export function targetFunction(param: string): string {
  return 'Hello ' + param;
}

export const TARGET_CONSTANT = 42;

export class ${newName} {
  method(): void {
    console.log('test');
  }
}
`;
              break;

            default:
              return Promise.resolve(right(`Failed to rename: Unknown symbol at line ${line}`));
          }

          // Write the new content to the file
          await fs.writeFile(uri, newContent);

          return Promise.resolve(right(`Successfully renamed symbol to "${newName}"`));
        }

        // Default behavior for non-temp files (existing tests)
        // Return Left to match MCP client behavior for non-existent files
        return Promise.resolve(left(`Failed to run tool refactor_rename_symbol: McpError: MCP error -32603: MCP error -32603: Failed to rename symbol: Error: ENOENT: no such file or directory, open '${uri}'`));
      }
      case 'list_available_code_actions': {
        const line = args.line as number;
        switch (line) {
          case 81: // Function with issues - should have code actions
            return Promise.resolve(right('Found 3 code action(s):\n\n1. Move to a new file (refactor.move)\n   📋 For executeCodeAction tool:\n{\n  "title": "Move to a new file",\n  "kind": "refactor.move",\n  "command": {\n    "title": "Move to a new file",\n    "command": "_typescript.applyRefactoring",\n    "arguments": [\n      {\n        "file": "/src/__tests__/integration/test-subjects/CodeActions.ts",\n        "startLine": 82,\n        "startOffset": 17,\n        "endLine": 82,\n        "endOffset": 51,\n        "refactor": "Move to a new file",\n        "action": "Move to a new file"\n      }\n    ]\n  }\n}\n   ⚡ Command: Move to a new file (_typescript.applyRefactoring)\n\n2. Convert parameters to destructured object (refactor)\n   📋 For executeCodeAction tool:\n{\n  "title": "Convert parameters to destructured object",\n  "kind": "refactor",\n  "command": {\n    "title": "Convert parameters to destructured object",\n    "command": "_typescript.applyRefactoring",\n    "arguments": [\n      {\n        "file": "/src/__tests__/integration/test-subjects/CodeActions.ts",\n        "startLine": 82,\n        "startOffset": 17,\n        "endLine": 82,\n        "endOffset": 51,\n        "refactor": "Convert parameters to destructured object",\n        "action": "Convert parameters to destructured object"\n      }\n    ]\n  }\n}\n   ⚡ Command: Convert parameters to destructured object (_typescript.applyRefactoring)\n\n3. Infer function return type (refactor)\n   📋 For executeCodeAction tool:\n{\n  "title": "Infer function return type",\n  "kind": "refactor",\n  "command": {\n    "title": "Infer function return type",\n    "command": "_typescript.applyRefactoring",\n    "arguments": [\n      {\n        "file": "/src/__tests__/integration/test-subjects/CodeActions.ts",\n        "startLine": 82,\n        "startOffset": 17,\n        "endLine": 82,\n        "endOffset": 51,\n        "refactor": "Infer function return type",\n        "action": "Infer function return type"\n      }\n    ]\n  }\n}\n   ⚡ Command: Infer function return type (_typescript.applyRefactoring)'));
          case 14: // Clean function - should also have move to new file action
            return Promise.resolve(right('Found 1 code action(s):\n\n1. Move to a new file (refactor.move)\n   📋 For executeCodeAction tool:\n{\n  "title": "Move to a new file",\n  "kind": "refactor.move",\n  "command": {\n    "title": "Move to a new file",\n    "command": "_typescript.applyRefactoring",\n    "arguments": [\n      {\n        "file": "/src/__tests__/integration/test-subjects/CodeActions.ts",\n        "startLine": 15,\n        "startOffset": 17,\n        "endLine": 15,\n        "endOffset": 46,\n        "refactor": "Move to a new file",\n        "action": "Move to a new file"\n      }\n    ]\n  }\n}\n   ⚡ Command: Move to a new file (_typescript.applyRefactoring)'));
          default:
            return Promise.resolve(right('No code actions available.'));
        }
      }
      case 'run_code_action':
        return Promise.resolve(right('⚠️ Code action "Test Code Action" has no WorkspaceEdit or Command to execute'));
      case 'list_caller_locations_of':
        return Promise.resolve(right('No callers found for symbol at src/__tests__/integration/test-subjects/CallHierarchy.ts:65:16'));
      case 'list_callee_locations_in':
        return Promise.resolve(right('Found 2 callees:\nhelperFunction at /src/__tests__/integration/test-subjects/CallHierarchy.ts:23:16-23:30\nvalidateInput at /src/__tests__/integration/test-subjects/CallHierarchy.ts:30:16-30:29'));
      default:
        return Promise.resolve(right(`Mock response for ${toolName}`));
    }
  }

  async init(): Promise<void> {
    // do nothing
  }

  async close(): Promise<void> {
    // do nothing
  }
}
