import { LSPServer } from "./LSPServer";
import { InitializeParams } from "./types/Initialize";
import { InitializedParams } from "./types/Initialized";
import { ResponseMessage } from "./types/ResponseMessage";
import { Hover, HoverParams, HoverT } from "./types/HoverRequest";
import { DidOpenTextDocumentParams } from "./types/DidOpenTextDocument";
import { DidCloseTextDocumentParams } from "./types/DidCloseTextDocument";
import { LSPServerEx as LSPServerEx } from "./LSPServerEx";
import { RenameParams } from "./types/RenameRequest";
import { WorkspaceEdit, WorkspaceEditT } from "./types/WorkspaceEdit";
import { ApplyWorkspaceEditParams, ApplyWorkspaceEditResult, ApplyWorkspaceEditResultT } from "./types/ApplyWorkspaceEditParams";

export class LSPServerExImpl implements LSPServerEx {
  constructor(private server: LSPServer) {}

  async initialize(params: InitializeParams): Promise<ResponseMessage> {
    return await this.server.sendRequest('initialize', params);
  }

  async initialized(params: InitializedParams): Promise<void> {
    await this.server.sendNotification('initialized', params);
  }

  async hover(params: HoverParams): Promise<Hover | null> {
    const result = await this.server.sendRequest('textDocument/hover', params);
    if (HoverT.is(result.result)) {
      return result.result;
    } else {
      return null;
    }
  }

  async rename(params: RenameParams): Promise<WorkspaceEdit | null> {
    const result = await this.server.sendRequest('textDocument/rename', params);
    if (WorkspaceEditT.is(result.result)) {
      return result.result;
    } else {
      return null;
    }
  }

  async didOpen(params: DidOpenTextDocumentParams): Promise<void> {
    await this.server.sendNotification('textDocument/didOpen', params);
  }

  async didClose(params: DidCloseTextDocumentParams): Promise<void> {
    await this.server.sendNotification('textDocument/didClose', params);
  }

  async applyEdit(params: ApplyWorkspaceEditParams): Promise<ApplyWorkspaceEditResult> {
    const result = await this.server.sendRequest('workspace/applyEdit', params);
    if (ApplyWorkspaceEditResultT.is(result.result)) {
      return result.result;
    }
    throw new Error(`[LSP] Invalid applyEdit result: ${JSON.stringify(result)}`);
  }
}
