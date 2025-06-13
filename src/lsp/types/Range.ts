import * as t from "io-ts";

import { Position, PositionT } from "./Position";

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
