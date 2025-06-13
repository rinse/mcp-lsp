import { NotificationMessage } from "./types/NotificationMessage";
import { RequestMessage } from "./types/RequestMessage";
import { ResponseMessage } from "./types/ResponseMessage";

export interface LSPServer {
  sendRequest(method: RequestMessage["method"], params?: RequestMessage["params"]): Promise<ResponseMessage>;
  sendNotification(method: NotificationMessage["method"], params?: NotificationMessage["params"]): Promise<void>;
  onRequest(callback: (message: RequestMessage) => void): void;
  onNotification(callback: (message: NotificationMessage) => void): void;
}
