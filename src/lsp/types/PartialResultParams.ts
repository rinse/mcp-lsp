import * as t from "io-ts";

export interface PartialResultParams {
  /**
   * An optional token that a server can use to report partial results (e.g. streaming) to
   * the client.
   */
  partialResultToken?: string | number;
}

export const PartialResultParamsT = t.partial({
  partialResultToken: t.union([t.string, t.number]),
});
