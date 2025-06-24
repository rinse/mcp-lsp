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
    if (toolName === 'get_hover_info') {
      return Promise.resolve(right('src/__tests__/integration/test-subjects/GetHoverInfo.ts:10:16\n  Type: function exampleFunction(): void'));
    }
    return Promise.resolve(right(`Mock response for ${toolName}`));
  }

  async init(): Promise<void> {
    // do nothing
  }

  async close(): Promise<void> {
    // do nothing
  }
}
