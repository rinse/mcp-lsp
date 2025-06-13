import * as t from 'io-ts';

/**
 * A general message as defined by JSON-RPC.
 * The language server protocol always uses “2.0”
 * as the jsonrpc version.
 */
export interface Message {
  jsonrpc: string;
}

export const MessageT = t.type({
  jsonrpc: t.string,
});
