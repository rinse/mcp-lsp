import { Either, right } from 'fp-ts/Either';

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  runTool(toolName: string, args: Record<string, unknown>): Promise<Either<string, string>> {
    switch (toolName) {
      case 'get_hover_info':
        return Promise.resolve(right('src/__tests__/integration/test-subjects/GetHoverInfo.ts:13:16\n  Type: function exampleFunction(): void\n  Docs: This is an example function for testing hover info'));
      case 'list_definition_locations':
        return Promise.resolve(right('Found 1 definitions:\nsrc/__tests__/integration/test-subjects/Definitions.ts:7:16-7:40'));
      case 'list_implementation_locations':
        return Promise.resolve(right('Found 2 implementations:\nsrc/__tests__/integration/test-subjects/Implementations.ts:15:13-15:32\nsrc/__tests__/integration/test-subjects/Implementations.ts:28:13-28:32'));
      case 'list_symbol_references':
        return Promise.resolve(right('Found 6 references:\nsrc/__tests__/integration/test-subjects/References.ts:7:16-7:40\nsrc/__tests__/integration/test-subjects/References.ts:23:11-23:35\nsrc/__tests__/integration/test-subjects/References.ts:29:19-29:43\nsrc/__tests__/integration/test-subjects/References.ts:31:19-31:43\nsrc/__tests__/integration/test-subjects/References.ts:42:13-42:37\nsrc/__tests__/integration/test-subjects/References.ts:52:9-52:33'));
      case 'get_type_declaration':
        return Promise.resolve(right('Found 1 type definitions:\nsrc/__tests__/integration/test-subjects/Types.ts:7:17-7:30'));
      case 'refactor_rename_symbol':
        return Promise.resolve(right('Success: Successfully renamed symbol to "newName"'));
      case 'list_available_code_actions':
        return Promise.resolve(right('Found 2 code actions:\n- Add explicit return type annotation\n- Remove unused parameter'));
      case 'run_code_action':
        return Promise.resolve(right('Successfully applied code action: Add explicit return type annotation'));
      case 'list_caller_locations_of':
        return Promise.resolve(right('Found 3 callers:\nsrc/__tests__/integration/test-subjects/CallHierarchy.ts:15:8-15:20\nsrc/__tests__/integration/test-subjects/CallHierarchy.ts:25:12-25:24\nsrc/__tests__/integration/test-subjects/CallHierarchy.ts:35:16-35:28'));
      case 'list_callee_locations_in':
        return Promise.resolve(right('Found 2 callees:\nsrc/__tests__/integration/test-subjects/CallHierarchy.ts:40:8-40:16\nsrc/__tests__/integration/test-subjects/CallHierarchy.ts:41:8-41:20'));
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
