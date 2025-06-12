import { integer } from "./BaseTypes";

/**
 * - method: ‘$/progress’
 * - params: ProgressParams defined as follows:
 */
export type ProgressToken = integer | string;

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
