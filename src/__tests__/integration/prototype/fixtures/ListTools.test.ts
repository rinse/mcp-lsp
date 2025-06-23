import { isRight } from 'fp-ts/Either';

import { testRunners } from '../TestRunner';

describe('ListTools Integration Test', () => {
  test.each(testRunners)('[%s] should successfully list tools with concrete expected output', async (_, runner) => {
    const result = await runner.listTools();

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      const expectedTools = `Available tools:
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
      expect(result.right).toBe(expectedTools);
    }
  }, 15000); // timeout
});

