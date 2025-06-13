import * as t from "io-ts";

import { ProgressToken, ProgressTokenT } from "./ProgressToken";

export interface WorkDoneProgressParams {
  /**
	 * An optional token that a server can use to report work done progress.
	 */
  workDoneToken?: ProgressToken;
}

export const WorkDoneProgressParamsT = t.partial({
  workDoneToken: ProgressTokenT,
});
