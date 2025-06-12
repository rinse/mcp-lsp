import { readFileSync } from "fs";
import { LSPServer } from "./LSPServer";
import { InitializeParams } from "./types/Initialize";
import { InitializedParams } from "./types/Initialized";
import { ResponseMessage } from "./types/ResponseMessage";
import { getLanguageIdentifier } from "./LanguageIdentifiers";
import { Hover, HoverParams, HoverT } from "./types/HoverRequest";
import { DidOpenTextDocumentParams } from "./types/DidOpenTextDocument";
import { DidCloseTextDocumentParams } from "./types/DidCloseTextDocument";
import { LSPRequester } from "./LSPRequester";

export class LSPRequesterImpl implements LSPRequester {
  private openDocuments: Set<string>;

  constructor(private server: LSPServer) {
    this.openDocuments = new Set<string>();
  }

  async initialize(rootUri: string): Promise<ResponseMessage> {
    console.error('[LSP] Initializing with rootUri:', rootUri);
    const initResult = await this.server.sendRequest('initialize', {
      processId: process.pid,
      rootUri,
      capabilities: {},
      trace: 'verbose'
    } satisfies InitializeParams);
    this.server.sendNotification('initialized', {} satisfies InitializedParams);
    console.error('[LSP] Initialization complete');
    return initResult;
  }

  async openDocument(uri: string): Promise<void> {
    const filePath = uri.replace('file://', '');
    const fileContent = readFileSync(filePath, 'utf-8');
    const languageId = getLanguageIdentifier(filePath);
    await this.didOpen(uri, languageId, 1, fileContent);
  }

  async closeDocument(uri: string): Promise<void> {
    if (this.openDocuments.has(uri)) {
      await this.didClose(uri);
      await this.openDocuments.delete(uri);
    }
  }

  async hover(uri: string, line: number, character: number): Promise<Hover | null> {
    if (!this.openDocuments.has(uri)) {
      await this.openDocument(uri);
    }
    const result = await this.server.sendRequest('textDocument/hover', {
      textDocument: { uri },
      position: { line, character },
    } satisfies HoverParams);
    if (HoverT.is(result.result)) {
      return result.result;
    } else {
      console.error('[LSP] Invalid hover result:', result);
      return null;
    }
  }

  private async didOpen(uri: string, languageId: string, version: number, text: string): Promise<void> {
    await this.server.sendNotification('textDocument/didOpen', {
      textDocument: { uri, languageId, version, text }
    } satisfies DidOpenTextDocumentParams);
    this.openDocuments.add(uri);
  }

  private async didClose(uri: string): Promise<void> {
    await this.server.sendNotification('textDocument/didClose', {
      textDocument: { uri }
    } satisfies DidCloseTextDocumentParams);
    this.openDocuments.delete(uri);
  }
}
