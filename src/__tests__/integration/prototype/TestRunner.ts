import { Either } from 'fp-ts/Either';

import { MockRunner } from './runner-mock/MockRunner';
import { InspectorRunner as InspectorCliRunner } from './runner-process/InspectorRunner';

export interface TestRunner {
  listTools(): Promise<Either<string, string>>;
  runTool(toolName: string, args: Record<string, unknown>): Promise<Either<string, string>>;
}

export const testRunners = [
  ["mock", new MockRunner()],
  ["inspector-cli", new InspectorCliRunner()],
] as const;
