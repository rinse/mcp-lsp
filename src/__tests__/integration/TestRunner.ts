import { Either } from 'fp-ts/Either';

import { TestRunnerMock } from './runners/TestRunnerMock';

export interface TestRunner {
  init(): Promise<void>;
  close(): Promise<void>;
  listTools(): Promise<Either<string, string>>;
  runTool(toolName: string, args: Record<string, unknown>): Promise<Either<string, string>>;
}

export const testRunners = [
  ["mock", (): TestRunnerMock => new TestRunnerMock()],
] as const;
