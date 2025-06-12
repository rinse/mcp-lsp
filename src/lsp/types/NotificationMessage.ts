import { Message } from "./AbstractMessage";
import * as t from "io-ts";


/**
 * A notification message.
 * A processed notification message must
 * not send a response back. They work like events.
 */
export interface NotificationMessage extends Message {
	/**
	 * The method to be invoked.
	 */
	method: string;

	/**
	 * The notification's params.
	 */
	params?: Array<unknown> | object;
}

export const NotificationMessageT = t.type({
	jsonrpc: t.string,
	method: t.string,
	params: t.union([t.array(t.unknown), t.record(t.string, t.unknown), t.undefined]),
});

export function isNotificationMessage(value: Message): value is NotificationMessage {
	const message = value as any;
	return NotificationMessageT.is(message);
}
