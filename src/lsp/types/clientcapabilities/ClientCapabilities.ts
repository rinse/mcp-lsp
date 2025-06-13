import { TextDocumentClientCapabilities } from "./TextDocumentClientCapabilities";
import { WorkspaceEditClientCapabilities } from "./WorkspaceEditClientCapabilities";

/**
 * Partial ClientCapabilities from the [specification](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#workspaceEditClientCapabilities).
 */
export interface ClientCapabilities {
  /**
	 * Workspace specific client capabilities.
	 */
  workspace?: {
    /**
		 * The client supports applying batch edits
		 * to the workspace by supporting the request
		 * 'workspace/applyEdit'
		 */
    applyEdit?: boolean;

    /**
		 * Capabilities specific to `WorkspaceEdit`s
		 */
    workspaceEdit?: WorkspaceEditClientCapabilities;
  },

  /**
	 * Text document specific client capabilities.
	 */
  textDocument?: TextDocumentClientCapabilities;
}
