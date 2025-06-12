import { Position, PositionT } from "./Position";
import { TextDocumentIdentifier, TextDocumentIdentifierT } from "./TextDocumentIdentifier";
import * as t from "io-ts";

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
