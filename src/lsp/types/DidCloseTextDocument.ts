import { DocumentUri } from "./Uri";

export interface DidCloseTextDocumentParams {
	/**
	 * The document that was closed.
	 */
	textDocument: TextDocumentIdentifier;
}

export interface TextDocumentIdentifier {
	/**
	 * The text document's URI.
	 */
	uri: DocumentUri;
}
