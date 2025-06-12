import { Position } from "./Position";
import { TextDocumentIdentifier } from "./TextDocumentIdentifier";

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
