import { integer } from "./BaseTypes";

export interface CancelParams {
	/**
	 * The request id to cancel.
	 */
	id: integer | string;
}
