import { getLanguageIdentifier } from "./LanguageIdentifiers";
import { LSPServerEx as LSPServerEx } from "./LSPServerEx";
import { Hover, HoverParams } from "./types/HoverRequest";
import { WorkspaceEdit } from "./types/WorkspaceEdit";
import { RenameParams } from "./types/RenameRequest";
import { ApplyWorkspaceEditParams, ApplyWorkspaceEditResult } from "./types/ApplyWorkspaceEditParams";
import { readFileAsync } from "../utils";

export class LSPManager {
  private openDocuments: Set<string>;

  constructor(private server: LSPServerEx) {
    this.openDocuments = new Set<string>();
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
        text: fileContent
      }
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
    return await this.server.applyEdit(params);
  }
}
