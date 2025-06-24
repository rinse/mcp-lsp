import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Type guard to validate that a response conforms to CallToolResult structure.
 * This provides safer type checking than simple type assertions.
 */
export function isCallToolResult(response: unknown): response is CallToolResult {
  if (typeof response !== 'object' || response === null) {
    return false;
  }

  const result = response as Record<string, unknown>;

  // Check if content exists and is an array
  if (!Array.isArray(result.content)) {
    return false;
  }

  // Check if each content item has the expected structure
  return result.content.every((item: unknown) => {
    if (typeof item !== 'object' || item === null) {
      return false;
    }
    const contentItem = item as Record<string, unknown>;
    return typeof contentItem.type === 'string';
  });
}

/**
 * Type guard to check if a content item is a text content item.
 */
export function isTextContent(item: unknown): item is { type: 'text'; text: string } {
  if (typeof item !== 'object' || item === null) {
    return false;
  }

  const contentItem = item as Record<string, unknown>;
  return contentItem.type === 'text' && typeof contentItem.text === 'string';
}
