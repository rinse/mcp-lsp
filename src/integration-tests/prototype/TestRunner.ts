import { Either } from 'fp-ts/Either';

export interface TestRunner {
  listTools(): Promise<Either<string, string>>;
  runTool(toolName: string, args: Record<string, unknown>): Promise<Either<string, string>>;
}
