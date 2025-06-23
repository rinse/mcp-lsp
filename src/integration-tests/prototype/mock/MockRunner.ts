import { Either, right } from 'fp-ts/Either';

import { TestRunner } from '../TestRunner';

export class MockRunner implements TestRunner {
  listTools(): Promise<Either<string, string>> {
    return Promise.resolve(right('Available tools:\n- get_hover_info\n- list_definition_locations'));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  runTool(toolName: string, args: Record<string, unknown>): Promise<Either<string, string>> {
    if (toolName === 'get_hover_info') {
      return Promise.resolve(right('/test/file.ts:10:5\n  Type: function example(): void\n  Docs: Example function'));
    }
    return Promise.resolve(right(`Mock response for ${toolName}`));
  }
}
