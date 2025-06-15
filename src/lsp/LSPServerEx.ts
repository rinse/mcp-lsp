import { ApplyWorkspaceEditParams, ApplyWorkspaceEditResult } from "./types/ApplyWorkspaceEditParams";
import { CallHierarchyItem, CallHierarchyIncomingCall, CallHierarchyIncomingCallsParams, CallHierarchyOutgoingCall, CallHierarchyOutgoingCallsParams, CallHierarchyPrepareParams } from "./types/CallHierarchyRequest";
import { CodeActionParams, CodeActionResult } from "./types/CodeActionRequest";
import { Definition, DefinitionParams } from "./types/DefinitionRequest";
import { DidCloseTextDocumentParams } from "./types/DidCloseTextDocument";
import { DidOpenTextDocumentParams } from "./types/DidOpenTextDocument";
import { ExecuteCommandParams, ExecuteCommandResult } from "./types/ExecuteCommandRequest";
import { Hover, HoverParams } from "./types/HoverRequest";
import { Implementation, ImplementationParams } from "./types/ImplementationRequest";
import { InitializeParams } from "./types/Initialize";
import { InitializedParams } from "./types/Initialized";
import { References, ReferenceParams } from "./types/ReferencesRequest";
import { RenameParams } from "./types/RenameRequest";
import { ResponseMessage } from "./types/ResponseMessage";
import { TypeDefinition, TypeDefinitionParams } from "./types/TypeDefinitionRequest";
import { WorkspaceEdit } from "./types/WorkspaceEdit";

export interface LSPServerEx {
  initialize(params: InitializeParams): Promise<ResponseMessage>;
  initialized(params: InitializedParams): Promise<void>;
  didOpen(params: DidOpenTextDocumentParams): Promise<void>;
  didClose(params: DidCloseTextDocumentParams): Promise<void>;
  hover(params: HoverParams): Promise<Hover | null>;
  definition(params: DefinitionParams): Promise<Definition>;
  implementation(params: ImplementationParams): Promise<Implementation>;
  references(params: ReferenceParams): Promise<References>;
  typeDefinition(params: TypeDefinitionParams): Promise<TypeDefinition>;
  rename(params: RenameParams): Promise<WorkspaceEdit | null>;
  prepareCallHierarchy(params: CallHierarchyPrepareParams): Promise<CallHierarchyItem[] | null>;
  incomingCalls(params: CallHierarchyIncomingCallsParams): Promise<CallHierarchyIncomingCall[] | null>;
  outgoingCalls(params: CallHierarchyOutgoingCallsParams): Promise<CallHierarchyOutgoingCall[] | null>;
  codeAction(params: CodeActionParams): Promise<CodeActionResult>;
  executeCommand(params: ExecuteCommandParams): Promise<ExecuteCommandResult>;
  applyEdit(params: ApplyWorkspaceEditParams): Promise<ApplyWorkspaceEditResult>;
}
