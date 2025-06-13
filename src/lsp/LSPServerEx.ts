import { ApplyWorkspaceEditParams, ApplyWorkspaceEditResult } from "./types/ApplyWorkspaceEditParams";
import { DidCloseTextDocumentParams } from "./types/DidCloseTextDocument";
import { DidOpenTextDocumentParams } from "./types/DidOpenTextDocument";
import { Hover, HoverParams } from "./types/HoverRequest";
import { InitializeParams } from "./types/Initialize";
import { InitializedParams } from "./types/Initialized";
import { RenameParams } from "./types/RenameRequest";
import { ResponseMessage } from "./types/ResponseMessage";
import { WorkspaceEdit } from "./types/WorkspaceEdit";

export interface LSPServerEx {
  initialize(params: InitializeParams): Promise<ResponseMessage>;
  initialized(params: InitializedParams): Promise<void>;
  didOpen(params: DidOpenTextDocumentParams): Promise<void>;
  didClose(params: DidCloseTextDocumentParams): Promise<void>;
  hover(params: HoverParams): Promise<Hover | null>;
  rename(params: RenameParams): Promise<WorkspaceEdit | null>;
  applyEdit(params: ApplyWorkspaceEditParams): Promise<ApplyWorkspaceEditResult>;
}
