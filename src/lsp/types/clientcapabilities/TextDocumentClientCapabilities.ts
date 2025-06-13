import { TextDocumentSyncClientCapabilities } from "./TextDocumentSyncClientCapabilities";

/**
 * Text document specific client capabilities.
 */
export interface TextDocumentClientCapabilities {
  synchronization?: TextDocumentSyncClientCapabilities;
}
