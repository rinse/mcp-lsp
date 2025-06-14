import { Location } from "../lsp/types/Location";

/**
 * Convert a Location to a human-readable string representation.
 *
 * @param location - The LSP Location object
 * @returns A string in the format "path:line:char" or "path:line:char-line:char" for ranges
 */
export function locationToString(location: Location): string {
  const filePath = location.uri.replace('file://', '');
  const start = location.range.start;
  const end = location.range.end;
  const startPos = `${start.line + 1}:${start.character + 1}`;

  // For single-position ranges (same start and end)
  if (start.line === end.line && start.character === end.character) {
    return `${filePath}:${startPos}`;
  }

  // For multi-line ranges, use Go-style format
  return `${filePath}:${startPos}-${end.line + 1}:${end.character + 1}`;
}
