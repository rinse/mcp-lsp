import { Message } from "./AbstractMessage";
import { integer } from "./BaseTypes";

/**
 * A request message to describe a request
 * between the client and the server.
 * Every processed request must send a response
 * back to the sender of the request.
 */
export interface RequestMessage extends Message {
  /**
	 * The request id.
	 */
  id: integer | string;

  /**
	 * The method to be invoked.
	 */
  method: string;

  /**
	 * The method's params.
	 */
  params?: unknown[] | object;
}

export function isRequestMessage(value: Message): value is RequestMessage {
  const message = value as RequestMessage;
  const hasId = typeof message.id === "number" || typeof message.id === "string";
  const hasMethod = typeof message.method === "string";
  const isParams = message.params === undefined
		|| Array.isArray(message.params)
		|| typeof message.params === "object";
  return hasId && hasMethod && isParams;
}
