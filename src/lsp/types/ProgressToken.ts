import * as t from "io-ts";

import { integer } from "./BaseTypes";

/**
 * Notification:
 *   - method: ‘$/progress’
 *   - params: ProgressParams defined as follows:
 */
export type ProgressToken = integer | string;

export const ProgressTokenT = t.union([t.number, t.string]);

export interface ProgressParams<T> {
  /**
	 * The progress token provided by the client or server.
	 */
  token: ProgressToken;

  /**
	 * The progress data.
	 */
  value: T;
}

export const ProgressParamsT = <T>(type: t.Type<T>): t.Type<ProgressParams<T>> => t.type({
  token: ProgressTokenT,
  value: type,
});
