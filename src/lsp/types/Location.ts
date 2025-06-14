import * as t from "io-ts";

import { Range, RangeT } from "./Range";
import { DocumentUri } from "./Uri";

export interface Location {
  uri: DocumentUri;
  range: Range;
}

export const LocationT = t.type({
  uri: t.string,
  range: RangeT,
});