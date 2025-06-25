import * as t from 'io-ts';

/**
 * io-ts codec for text content items in MCP responses.
 */
export const TextContentT = t.type({
  type: t.literal('text'),
  text: t.string,
});

/**
 * io-ts codec for content items which can have various types.
 * For now we only handle text content, but this can be extended.
 */
export const ContentItemT = t.union([
  TextContentT,
  // Other content types can be added here as needed
  t.type({
    type: t.string,
    // Allow other properties for non-text content types
  }),
]);

/**
 * io-ts codec for CallToolResult structure.
 * Validates that a response conforms to the expected MCP CallToolResult format.
 */
export const CallToolResultT = t.type({
  content: t.array(ContentItemT),
});

/**
 * Type guard to validate that a response conforms to CallToolResult structure.
 * Uses io-ts for runtime validation.
 */
export function isCallToolResult(response: unknown): response is t.TypeOf<typeof CallToolResultT> {
  return CallToolResultT.is(response);
}

/**
 * Type guard to check if a content item is a text content item.
 * Uses io-ts for runtime validation.
 */
export function isTextContent(item: unknown): item is t.TypeOf<typeof TextContentT> {
  return TextContentT.is(item);
}
