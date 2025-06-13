import * as t from "io-ts";

import { DocumentUri } from "./Uri";

export interface TextDocumentIdentifier {
  /**
	 * The text document's URI.
	 */
  uri: DocumentUri;
}

export const TextDocumentIdentifierT = t.type({
  uri: t.string,
});
