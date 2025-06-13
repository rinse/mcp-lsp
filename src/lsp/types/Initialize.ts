import { ClientCapabilities, ServerCapabilities } from "@modelcontextprotocol/sdk/types";

import { integer, LSPAny } from "./BaseTypes";
import { TraceValue } from "./TraceValue";
import { DocumentUri } from "./Uri";
import { WorkDoneProgressParams } from "./WorkDoneProgressParams";
import { WorkspaceFolder } from "./WorkspaceFolder";

export interface InitializeParams extends WorkDoneProgressParams {
  /**
	 * The process Id of the parent process that started the server. Is null if
	 * the process has not been started by another process. If the parent
	 * process is not alive then the server should exit (see exit notification)
	 * its process.
	 */
  processId: integer | null;

  /**
	 * Information about the client
	 *
	 * @since 3.15.0
	 */
  clientInfo?: {
    /**
		 * The name of the client as defined by the client.
		 */
    name: string;

    /**
		 * The client's version as defined by the client.
		 */
    version?: string;
  };

  /**
	 * The locale the client is currently showing the user interface
	 * in. This must not necessarily be the locale of the operating
	 * system.
	 *
	 * Uses IETF language tags as the value's syntax
	 * (See https://en.wikipedia.org/wiki/IETF_language_tag)
	 *
	 * @since 3.16.0
	 */
  locale?: string;

  /**
	 * The rootPath of the workspace. Is null
	 * if no folder is open.
	 *
	 * @deprecated in favour of `rootUri`.
	 */
  rootPath?: string | null;

  /**
	 * The rootUri of the workspace. Is null if no
	 * folder is open. If both `rootPath` and `rootUri` are set
	 * `rootUri` wins.
	 *
	 * @deprecated in favour of `workspaceFolders`
	 */
  rootUri: DocumentUri | null;

  /**
	 * User provided initialization options.
	 */
  initializationOptions?: LSPAny;

  /**
	 * The capabilities provided by the client (editor or tool)
	 */
  capabilities: ClientCapabilities;

  /**
	 * The initial trace setting. If omitted trace is disabled ('off').
	 */
  trace?: TraceValue;

  /**
	 * The workspace folders configured in the client when the server starts.
	 * This property is only available if the client supports workspace folders.
	 * It can be `null` if the client supports workspace folders but none are
	 * configured.
	 *
	 * @since 3.6.0
	 */
  workspaceFolders?: WorkspaceFolder[] | null;
}

export interface InitializeResult {
  /**
	 * The capabilities the language server provides.
	 */
  capabilities: ServerCapabilities;

  /**
	 * Information about the server.
	 *
	 * @since 3.15.0
	 */
  serverInfo?: {
    /**
		 * The name of the server as defined by the server.
		 */
    name: string;

    /**
		 * The server's version as defined by the server.
		 */
    version?: string;
  };
}

/**
 * Known error codes for an `InitializeErrorCodes`;
 */
export const InitializeErrorCodes = {

  /**
	 * If the protocol version provided by the client can't be handled by
	 * the server.
	 *
	 * @deprecated This initialize error got replaced by client capabilities.
	 * There is no version handshake in version 3.0x
	 */
  unknownProtocolVersion: 1 as const,
} as const;

export type InitializeErrorCodes = 1;

export interface InitializeError {
  /**
	 * Indicates whether the client execute the following retry logic:
	 * (1) show the message provided by the ResponseError to the user
	 * (2) user selects retry or cancel
	 * (3) if user selected retry the initialize method is sent again.
	 */
  retry: boolean;
}
