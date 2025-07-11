import { LSPServer } from "./LSPServer";
import { LSPServerEx as LSPServerEx } from "./LSPServerEx";
import { ApplyWorkspaceEditParams, ApplyWorkspaceEditResult, ApplyWorkspaceEditResultT } from "./types/ApplyWorkspaceEditParams";
import { CallHierarchyItem, CallHierarchyIncomingCall, CallHierarchyIncomingCallsParams, CallHierarchyOutgoingCall, CallHierarchyOutgoingCallsParams, CallHierarchyPrepareParams, CallHierarchyItemArrayT, CallHierarchyIncomingCallArrayT, CallHierarchyOutgoingCallArrayT } from "./types/CallHierarchyRequest";
import { CodeActionParams, CodeActionResult, CodeActionResultT } from "./types/CodeActionRequest";
import { Definition, DefinitionParams, DefinitionT } from "./types/DefinitionRequest";
import { DidCloseTextDocumentParams } from "./types/DidCloseTextDocument";
import { DidOpenTextDocumentParams } from "./types/DidOpenTextDocument";
import { ExecuteCommandParams, ExecuteCommandResult, ExecuteCommandResultT } from "./types/ExecuteCommandRequest";
import { Hover, HoverParams, HoverT } from "./types/HoverRequest";
import { Implementation, ImplementationParams, ImplementationT } from "./types/ImplementationRequest";
import { InitializeParams } from "./types/Initialize";
import { InitializedParams } from "./types/Initialized";
import { References, ReferenceParams, ReferencesT } from "./types/ReferencesRequest";
import { RenameParams } from "./types/RenameRequest";
import { ResponseMessage } from "./types/ResponseMessage";
import { TypeDefinition, TypeDefinitionParams, TypeDefinitionT } from "./types/TypeDefinitionRequest";
import { WorkspaceEdit, WorkspaceEditT } from "./types/WorkspaceEdit";
import { logger } from "../utils/loggers";

export class LSPServerExImpl implements LSPServerEx {
  constructor(private server: LSPServer) {}

  async initialize(params: InitializeParams): Promise<ResponseMessage> {
    logger.debug("[LSP] Initializing LSP server with params:", params);
    const result = await this.server.sendRequest('initialize', params);
    if (result.result && typeof result.result === 'object' && 'capabilities' in result.result) {
      logger.info("[LSP] Server capabilities:", result.result.capabilities);
    }
    logger.debug("[LSP] Full initialization result:", result);
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
    }
    return null;

  }

  async definition(params: DefinitionParams): Promise<Definition> {
    logger.debug("[LSP] Requesting definition with params:", params);
    const result = await this.server.sendRequest('textDocument/definition', params);
    logger.debug("[LSP] Definition request completed with result:", result);
    if (DefinitionT.is(result.result)) {
      return result.result;
    }
    return null;

  }

  async implementation(params: ImplementationParams): Promise<Implementation> {
    logger.debug("[LSP] Requesting implementation with params:", params);
    const result = await this.server.sendRequest('textDocument/implementation', params);
    logger.debug("[LSP] Implementation request completed with result:", result);
    return ImplementationT.is(result.result) ? result.result : null;
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

  async typeDefinition(params: TypeDefinitionParams): Promise<TypeDefinition> {
    logger.debug("[LSP] Requesting typeDefinition with params:", params);
    const result = await this.server.sendRequest('textDocument/typeDefinition', params);
    logger.debug("[LSP] TypeDefinition request completed with result:", result);
    if (TypeDefinitionT.is(result.result)) {
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
    }
    return null;

  }

  async prepareCallHierarchy(params: CallHierarchyPrepareParams): Promise<CallHierarchyItem[] | null> {
    logger.debug("[LSP] Requesting prepareCallHierarchy with params:", params);
    const result = await this.server.sendRequest('textDocument/prepareCallHierarchy', params);
    logger.debug("[LSP] PrepareCallHierarchy request completed with result:", result);
    if (CallHierarchyItemArrayT.is(result.result)) {
      return result.result;
    }
    return null;
  }

  async incomingCalls(params: CallHierarchyIncomingCallsParams): Promise<CallHierarchyIncomingCall[] | null> {
    logger.debug("[LSP] Requesting incomingCalls with params:", params);
    const result = await this.server.sendRequest('callHierarchy/incomingCalls', params);
    logger.debug("[LSP] IncomingCalls request completed with result:", result);
    if (CallHierarchyIncomingCallArrayT.is(result.result)) {
      return result.result;
    }
    return null;
  }

  async outgoingCalls(params: CallHierarchyOutgoingCallsParams): Promise<CallHierarchyOutgoingCall[] | null> {
    logger.debug("[LSP] Requesting outgoingCalls with params:", params);
    const result = await this.server.sendRequest('callHierarchy/outgoingCalls', params);
    logger.debug("[LSP] OutgoingCalls request completed with result:", result);
    if (CallHierarchyOutgoingCallArrayT.is(result.result)) {
      return result.result;
    }
    return null;
  }

  async codeAction(params: CodeActionParams): Promise<CodeActionResult> {
    logger.debug("[LSP] Requesting code action with params:", params);
    const result = await this.server.sendRequest('textDocument/codeAction', params);
    logger.debug("[LSP] Code action request completed with result:", result);
    if (CodeActionResultT.is(result.result)) {
      return result.result;
    }
    logger.warn("[LSP] Invalid code action result type", { result: result.result });
    return null;
  }

  async executeCommand(params: ExecuteCommandParams): Promise<ExecuteCommandResult> {
    logger.debug("[LSP] Executing command with params:", params);
    const result = await this.server.sendRequest('workspace/executeCommand', params);
    logger.debug("[LSP] Execute command request completed with result:", result);
    if (result.result === undefined) {
      return null;
    }
    if (ExecuteCommandResultT.is(result.result)) {
      return result.result;
    }
    logger.warn("[LSP] Invalid execute command result type", { result: result.result });
    return null;
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
