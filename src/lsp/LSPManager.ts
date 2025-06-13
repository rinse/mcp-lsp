import { getLanguageIdentifier } from "./LanguageIdentifiers";
import { LSPServerEx as LSPServerEx } from "./LSPServerEx";
import { readFileAsync } from "../utils";
import { ApplyWorkspaceEditParams, ApplyWorkspaceEditResult } from "./types/ApplyWorkspaceEditParams";
import { Hover, HoverParams } from "./types/HoverRequest";
import { RenameParams } from "./types/RenameRequest";
import { WorkspaceEdit } from "./types/WorkspaceEdit";
import { WorkspaceEditApplier } from "./WorkspaceEditApplier";

export class LSPManager {
  private openDocuments: Set<string>;
  private workspaceEditApplier: WorkspaceEditApplier;

  constructor(private server: LSPServerEx) {
    this.openDocuments = new Set<string>();
    this.workspaceEditApplier = new WorkspaceEditApplier();
  }

  async openDocument(uri: string): Promise<void> {
    if (this.openDocuments.has(uri)) {
      return;
    }
    const filePath = uri.replace('file://', '');
    const fileContent = await readFileAsync(filePath);
    const languageId = getLanguageIdentifier(filePath);
    await this.server.didOpen({
      textDocument: {
        uri,
        languageId,
        version: 1,
        text: fileContent,
      },
    });
    this.openDocuments.add(uri);
  }

  async closeDocument(uri: string): Promise<void> {
    if (!this.openDocuments.has(uri)) {
      return;
    }
    await this.server.didClose({
      textDocument: { uri },
    });
    this.openDocuments.delete(uri);
  }

  async hover(params: HoverParams): Promise<Hover | null> {
    await this.openDocument(params.textDocument.uri);
    return await this.server.hover(params);
  }

  async rename(params: RenameParams): Promise<WorkspaceEdit | null> {
    await this.openDocument(params.textDocument.uri);
    return await this.server.rename(params);
  }

  async applyEdit(params: ApplyWorkspaceEditParams): Promise<ApplyWorkspaceEditResult> {
    // Apply the workspace edit locally instead of sending to server
    // The LSP spec defines workspace/applyEdit as a server-to-client request,
    // not client-to-server
    return await this.workspaceEditApplier.applyWorkspaceEdit(params.edit);
  }
}
