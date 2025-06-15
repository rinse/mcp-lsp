import { getLanguageIdentifier } from "./LanguageIdentifiers";
import { LSPServerEx as LSPServerEx } from "./LSPServerEx";
import { readFileAsync } from "../utils";
import { ApplyWorkspaceEditParams, ApplyWorkspaceEditResult } from "./types/ApplyWorkspaceEditParams";
import { CodeActionParams, CodeActionResult } from "./types/CodeActionRequest";
import { CompletionParams, CompletionResult } from "./types/CompletionRequest";
import { Definition, DefinitionParams } from "./types/DefinitionRequest";
import { ExecuteCommandParams, ExecuteCommandResult } from "./types/ExecuteCommandRequest";
import { Hover, HoverParams } from "./types/HoverRequest";
import { Implementation, ImplementationParams } from "./types/ImplementationRequest";
import { References, ReferenceParams } from "./types/ReferencesRequest";
import { RenameParams } from "./types/RenameRequest";
import { TypeDefinition, TypeDefinitionParams } from "./types/TypeDefinitionRequest";
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

  async completion(params: CompletionParams): Promise<CompletionResult> {
    await this.openDocument(params.textDocument.uri);
    return await this.server.completion(params);
  }

  async definition(params: DefinitionParams): Promise<Definition> {
    await this.openDocument(params.textDocument.uri);
    return await this.server.definition(params);
  }

  async implementation(params: ImplementationParams): Promise<Implementation> {
    await this.openDocument(params.textDocument.uri);
    return await this.server.implementation(params);
  }

  async references(params: ReferenceParams): Promise<References> {
    await this.openDocument(params.textDocument.uri);
    return await this.server.references(params);
  }

  async typeDefinition(params: TypeDefinitionParams): Promise<TypeDefinition> {
    await this.openDocument(params.textDocument.uri);
    return await this.server.typeDefinition(params);
  }

  async rename(params: RenameParams): Promise<WorkspaceEdit | null> {
    await this.openDocument(params.textDocument.uri);
    return await this.server.rename(params);
  }

  async codeAction(params: CodeActionParams): Promise<CodeActionResult> {
    await this.openDocument(params.textDocument.uri);
    return await this.server.codeAction(params);
  }

  async executeCommand(params: ExecuteCommandParams): Promise<ExecuteCommandResult> {
    return await this.server.executeCommand(params);
  }

  async applyEdit(params: ApplyWorkspaceEditParams): Promise<ApplyWorkspaceEditResult> {
    // Apply the workspace edit locally instead of sending to server
    // The LSP spec defines workspace/applyEdit as a server-to-client request,
    // not client-to-server
    return await this.workspaceEditApplier.applyWorkspaceEdit(params.edit);
  }
}
