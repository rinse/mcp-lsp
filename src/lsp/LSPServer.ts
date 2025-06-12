import { ResponseMessage } from "./types/ResponseMessage";

export interface LSPServer {
  sendRequest(method: string, params?: object | unknown[]): Promise<ResponseMessage>;
  sendNotification(method: string, params?: object | unknown[]): Promise<void>;
}
