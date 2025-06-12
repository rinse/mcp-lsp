import { integer } from "./BaseTypes";
import { DocumentUri } from "./Uri";

export interface DidOpenTextDocumentParams {
    /**
	 * The document that was opened.
	 */
    textDocument: TextDocumentItem;
}

export interface TextDocumentItem {
	/**
	 * The text document's URI.
	 */
	uri: DocumentUri;

	/**
	 * The text document's language identifier.
	 */
	languageId: string;

	/**
	 * The version number of this document (it will increase after each
	 * change, including undo/redo).
	 */
	version: integer;

	/**
	 * The content of the opened text document.
	 */
	text: string;
}
