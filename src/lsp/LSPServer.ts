import { RequestMessage } from "./types/RequestMessage";
import { ResponseMessage } from "./types/ResponseMessage";

export interface LSPServer {
  sendRequest(method: RequestMessage["method"], params?: RequestMessage["params"]): Promise<ResponseMessage>;
  sendNotification(method: RequestMessage["method"], params?: RequestMessage["params"]): Promise<void>;
}
