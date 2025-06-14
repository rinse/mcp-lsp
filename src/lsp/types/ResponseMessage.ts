/**
 * A Response Message sent as a result of a request.
 * If a request doesn’t provide a result value
 * the receiver of a request still needs to return
 * a response message to conform to the JSON-RPC
 * specification. The result property of the
 * ResponseMessage should be set to null in this case
 * to signal a successful request.
 */
import { Message } from "./AbstractMessage";
import { integer, isLSPAny, LSPAny } from "./BaseTypes";

export interface ResponseMessage extends Message {
  /**
	 * The request id.
	 */
  id: integer | string | null;

  /**
	 * The result of a request. This member is REQUIRED on success.
	 * This member MUST NOT exist if there was an error invoking the method.
	 */
  result?: LSPAny;

  /**
	 * The error object in case a request fails.
	 */
  error?: ResponseError;
}

export function isResponseMessage(value: Message): value is ResponseMessage {
  const message = value as ResponseMessage;
  const hasId = message.id === null || typeof message.id  === "number" || typeof message.id  === "string";
  const hasResult = message.result === undefined || isLSPAny(message.result);
  const hasError = message.error === undefined || isLSPError(message.error);
  return hasId && (hasResult || hasError);
}

export interface ResponseError {
  /**
	 * A number indicating the error type that occurred.
	 */
  code: integer;

  /**
	 * A string providing a short description of the error.
	 */
  message: string;

  /**
	 * A primitive or structured value that contains additional
	 * information about the error. Can be omitted.
	 */
  data?: LSPAny;
}

export function isLSPError(value: unknown): value is ResponseError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const error = value as ResponseError;
  return (
    typeof error.code === 'number' &&
		typeof error.message === 'string' &&
		(error.data === undefined || isLSPAny(error.data))
  );
}

export const ErrorCodes = {
  // Defined by JSON-RPC
  ParseError: -32700 as const,
  InvalidRequest: -32600 as const,
  MethodNotFound: -32601 as const,
  InvalidParams: -32602 as const,
  InternalError: -32603 as const,

  /**
	 * This is the start range of JSON-RPC reserved error codes.
	 * It doesn't denote a real error code. No LSP error codes should
	 * be defined between the start and end range. For backwards
	 * compatibility the `ServerNotInitialized` and the `UnknownErrorCode`
	 * are left in the range.
	 *
	 * @since 3.16.0
	 */
  jsonrpcReservedErrorRangeStart: -32099 as const,

  /** @deprecated use jsonrpcReservedErrorRangeStart */
  get serverErrorStart() { return this.jsonrpcReservedErrorRangeStart; },

  /**
	 * Error code indicating that a server received a notification or
	 * request before the server received the `initialize` request.
	 */
  ServerNotInitialized: -32002 as const,

  UnknownErrorCode: -32001 as const,

  /**
	 * This is the end range of JSON-RPC reserved error codes.
	 * It doesn't denote a real error code.
	 *
	 * @since 3.16.0
	 */
  jsonrpcReservedErrorRangeEnd: -32000 as const,

  /** @deprecated use jsonrpcReservedErrorRangeEnd */
  get serverErrorEnd() { return this.jsonrpcReservedErrorRangeEnd; },

  /**
	 * This is the start range of LSP reserved error codes.
	 * It doesn't denote a real error code.
	 *
	 * @since 3.16.0
	 */
  lspReservedErrorRangeStart: -32899 as const,

  /**
	 * A request failed but it was syntactically correct, e.g the
	 * method name was known and the parameters were valid. The error
	 * message should contain human readable information about why
	 * the request failed.
	 *
	 * @since 3.17.0
	 */
  RequestFailed: -32803 as const,

  /**
	 * The server cancelled the request. This error code should
	 * only be used for requests that explicitly support being
	 * server cancellable.
	 *
	 * @since 3.17.0
	 */
  ServerCancelled: -32802 as const,

  /**
	 * The server detected that the content of a document got
	 * modified outside normal conditions. A server should
	 * NOT send this error code if it detects a content change
	 * in its unprocessed messages. The result even computed
	 * on an older state might still be useful for the client.
	 *
	 * If a client decides that a result is not of any use anymore
	 * the client should cancel the request.
	 */
  ContentModified: -32801 as const,

  /**
	 * The client has canceled a request and a server has detected
	 * the cancel.
	 */
  RequestCancelled: -32800 as const,

  /**
	 * This is the end range of LSP reserved error codes.
	 * It doesn't denote a real error code.
	 *
	 * @since 3.16.0
	 */
  lspReservedErrorRangeEnd: -32800 as const,
} as const;
