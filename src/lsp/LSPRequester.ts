import { ResponseMessage } from "./types/ResponseMessage";
import { Hover } from "./types/HoverRequest";

export interface LSPRequester {
  initialize(rootUri: string): Promise<ResponseMessage>;
  openDocument(uri: string): Promise<void>;
  closeDocument(uri: string): Promise<void>;
  hover(uri: string, line: number, character: number): Promise<Hover | null>;
}

