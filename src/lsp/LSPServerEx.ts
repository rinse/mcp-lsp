import { ResponseMessage } from "./types/ResponseMessage";
import { Hover, HoverParams } from "./types/HoverRequest";
import { WorkspaceEdit } from "./types/WorkspaceEdit";
import { RenameParams } from "./types/RenameRequest";
import { InitializeParams } from "./types/Initialize";
import { DidOpenTextDocumentParams } from "./types/DidOpenTextDocument";
import { DidCloseTextDocumentParams } from "./types/DidCloseTextDocument";
import { InitializedParams } from "./types/Initialized";
import { ApplyWorkspaceEditParams, ApplyWorkspaceEditResult } from "./types/ApplyWorkspaceEditParams";

export interface LSPServerEx {
  initialize(params: InitializeParams): Promise<ResponseMessage>;
  initialized(params: InitializedParams): Promise<void>;
  didOpen(params: DidOpenTextDocumentParams): Promise<void>;
  didClose(params: DidCloseTextDocumentParams): Promise<void>;
  hover(params: HoverParams): Promise<Hover | null>;
  rename(params: RenameParams): Promise<WorkspaceEdit | null>;
  applyEdit(params: ApplyWorkspaceEditParams): Promise<ApplyWorkspaceEditResult>;
}
