import { LSPServer } from "./LSPServer";
import { LSPServerEx as LSPServerEx } from "./LSPServerEx";
import { ApplyWorkspaceEditParams, ApplyWorkspaceEditResult, ApplyWorkspaceEditResultT } from "./types/ApplyWorkspaceEditParams";
import { Definition, DefinitionParams, DefinitionT } from "./types/DefinitionRequest";
import { DidCloseTextDocumentParams } from "./types/DidCloseTextDocument";
import { DidOpenTextDocumentParams } from "./types/DidOpenTextDocument";
import { Hover, HoverParams, HoverT } from "./types/HoverRequest";
import { InitializeParams } from "./types/Initialize";
import { InitializedParams } from "./types/Initialized";
import { References, ReferenceParams, ReferencesT } from "./types/ReferencesRequest";
import { RenameParams } from "./types/RenameRequest";
import { ResponseMessage } from "./types/ResponseMessage";
import { WorkspaceEdit, WorkspaceEditT } from "./types/WorkspaceEdit";
import { logger } from "../utils/logger";

export class LSPServerExImpl implements LSPServerEx {
  constructor(private server: LSPServer) {}

  async initialize(params: InitializeParams): Promise<ResponseMessage> {
    logger.debug("[LSP] Initializing LSP server with params:", params);
    const result = await this.server.sendRequest('initialize', params);
    if (result.result && typeof result.result === 'object' && 'capabilities' in result.result) {
      logger.info("[LSP] Server capabilities:", JSON.stringify(result.result.capabilities, null, 2));
    }
    logger.debug("[LSP] Full initialization result:", JSON.stringify(result, null, 2));
    return result;
  }

  async initialized(params: InitializedParams): Promise<void> {
    logger.debug("[LSP] Notifying LSP server initialized with params:", params);
    await this.server.sendNotification('initialized', params);
    logger.debug("[LSP] Notifying LSP server initialized completed");
  }

  async hover(params: HoverParams): Promise<Hover | null> {
    logger.debug("[LSP] Requesting hover information with params:", params);
    const result = await this.server.sendRequest('textDocument/hover', params);
    logger.debug("[LSP] Hover request completed with result:", result);
    if (HoverT.is(result.result)) {
      return result.result;
    } else {
      return null;
    }
  }

  async definition(params: DefinitionParams): Promise<Definition> {
    logger.debug("[LSP] Requesting definition with params:", params);
    const result = await this.server.sendRequest('textDocument/definition', params);
    logger.debug("[LSP] Definition request completed with result:", result);
    if (DefinitionT.is(result.result)) {
      return result.result;
    } else {
      return null;
    }
  }

  async references(params: ReferenceParams): Promise<References> {
    logger.debug("[LSP] Requesting references with params:", params);
    const result = await this.server.sendRequest('textDocument/references', params);
    logger.debug("[LSP] References request completed with result:", result);
    if (ReferencesT.is(result.result)) {
      return result.result;
    } else {
      return null;
    }
  }

  async rename(params: RenameParams): Promise<WorkspaceEdit | null> {
    logger.debug("[LSP] Requesting rename with params:", params);
    const result = await this.server.sendRequest('textDocument/rename', params);
    logger.debug("[LSP] Rename request completed with result:", result);
    if (WorkspaceEditT.is(result.result)) {
      return result.result;
    } else {
      return null;
    }
  }

  async applyEdit(params: ApplyWorkspaceEditParams): Promise<ApplyWorkspaceEditResult> {
    logger.debug("[LSP] Requesting rename with params:", params);
    const result = await this.server.sendRequest('workspace/applyEdit', params);
    logger.debug("[LSP] Apply edit request completed with result:", result);
    if (ApplyWorkspaceEditResultT.is(result.result)) {
      return result.result;
    }
    throw new Error(`[LSP] Invalid applyEdit result: ${JSON.stringify(result)}`);
  }

  async didOpen(params: DidOpenTextDocumentParams): Promise<void> {
    logger.debug("[LSP] Notifying LSP server document opened with params:", params);
    const result = await this.server.sendNotification('textDocument/didOpen', params);
    logger.debug("[LSP] Document opened notification completed with result:", result);
    return result;
  }

  async didClose(params: DidCloseTextDocumentParams): Promise<void> {
    logger.debug("[LSP] Notifying LSP server document closed with params:", params);
    const result = await this.server.sendNotification('textDocument/didClose', params);
    logger.debug("[LSP] Document closed notification completed with result:", result);
    return result;
  }
}
