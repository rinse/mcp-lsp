import * as t from "io-ts";

import { LSPAny } from "./BaseTypes";

export interface ExecuteCommandParams {
  /**
   * The identifier of the actual command handler.
   */
  command: string;

  /**
   * Arguments that the command handler should be invoked with.
   */
  arguments?: LSPAny[];
}

export const ExecuteCommandParamsT = t.intersection([
  t.type({
    command: t.string,
  }),
  t.partial({
    arguments: t.array(t.any),
  }),
]);

/**
 * The result of a workspace/executeCommand request.
 */
export type ExecuteCommandResult = LSPAny | null;
