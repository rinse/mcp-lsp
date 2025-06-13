import * as t from "io-ts";

import { Position, PositionT } from "./Position";
import { TextDocumentIdentifier, TextDocumentIdentifierT } from "./TextDocumentIdentifier";

export interface TextDocumentPositionParams {
  /**
	 * The text document.
	 */
  textDocument: TextDocumentIdentifier;

  /**
	 * The position inside the text document.
	 */
  position: Position;
}

export const TextDocumentPositionParamsT = t.type({
  textDocument: TextDocumentIdentifierT,
  position: PositionT,
});
