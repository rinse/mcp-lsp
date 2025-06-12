import { DocumentUri } from "./Uri";
import * as t from "io-ts";

export interface TextDocumentIdentifier {
	/**
	 * The text document's URI.
	 */
	uri: DocumentUri;
}

export const TextDocumentIdentifierT = t.type({
	uri: t.string,
});
