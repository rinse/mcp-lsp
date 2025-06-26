import { either } from 'fp-ts';

import { testRunners, TestRunner } from '../TestRunner';

describe('ListTools Integration Test', () => {
  const runners: [string, TestRunner][] = testRunners.map(([name, init]) => [name, init()]);

  beforeAll(async () => {
    const promises = runners.map(([, runner]) => runner.init());
    await Promise.all(promises);
  });

  afterAll(async () => {
    const promises = runners.map(([, runner]) => runner.close());
    await Promise.all(promises);
  });

  test.each(runners)('[%s] should successfully list tools with concrete expected output', async (name, runner) => {
    const result = await runner.listTools();
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
    expect(result).toEqual(either.right(expectedTools));
  }, 10000); // timeout
});
