import { Position, PositionT } from "./Position";
import * as t from "io-ts";

export interface Range {
	/**
	 * The range's start position.
	 */
	start: Position;

	/**
	 * The range's end position.
	 */
	end: Position;
}

export const RangeT = t.type({
	start: PositionT,
	end: PositionT,
});
