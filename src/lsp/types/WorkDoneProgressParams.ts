import { ProgressToken } from "./ProgressToken";

export interface WorkDoneProgressParams {
	/**
	 * An optional token that a server can use to report work done progress.
	 */
	workDoneToken?: ProgressToken;
}
