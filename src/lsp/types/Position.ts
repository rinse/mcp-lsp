import * as t from "io-ts";

import { uinteger } from "./BaseTypes";

export interface Position {
  /**
	 * Line position in a document (zero-based).
	 */
  line: uinteger;

  /**
	 * Character offset on a line in a document (zero-based). The meaning of this
	 * offset is determined by the negotiated `PositionEncodingKind`.
	 *
	 * If the character value is greater than the line length it defaults back
	 * to the line length.
	 */
  character: uinteger;
}

export const PositionT = t.type({
  line: uinteger,
  character: uinteger,
});;

/**
 * A type indicating how positions are encoded,
 * specifically what column offsets mean.
 *
 * @since 3.17.0
 */
export type PositionEncodingKind = string;

/**
 * A set of predefined position encoding kinds.
 *
 * @since 3.17.0
 */
export const PositionEncodingKind = {
  /**
	 * Character offsets count UTF-8 code units (e.g bytes).
	 */
  UTF8: 'utf-8' as const,

  /**
	 * Character offsets count UTF-16 code units.
	 *
	 * This is the default and must always be supported
	 * by servers
	 */
  UTF16: 'utf-16' as const,

  /**
	 * Character offsets count UTF-32 code units.
	 *
	 * Implementation note: these are the same as Unicode code points,
	 * so this `PositionEncodingKind` may also be used for an
	 * encoding-agnostic representation of character offsets.
	 */
  UTF32: 'utf-32' as const,
} as const;
