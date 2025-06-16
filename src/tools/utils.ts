import { Location } from "../lsp/types/Location";
import { Range } from "../lsp/types/Range";

/**
 * Convert a Location to a human-readable string representation.
 *
 * @param location - The LSP Location object
 * @returns A string in the format "path:line:char" or "path:line:char-line:char" for ranges
 */
export function locationToString(location: Location): string {
  const filePath = location.uri.replace('file://', '');
  return `${filePath}:${rangeToString(location.range)}`;
}

/**
 * Convert a Range to a human-readable string representation.
 *
 * @param range - The LSP Range object
 * @returns A string in the format "X:Y" or "X:Y-A:B" for ranges
 */
export function rangeToString(range: Range): string {
  const start = range.start;
  const end = range.end;
  const startPos = `${start.line + 1}:${start.character + 1}`;
  // For single-position ranges (same start and end)
  if (start.line === end.line && start.character === end.character) {
    return startPos;
  }
  // For multi-line ranges, use Go-style format
  return `${startPos}-${end.line + 1}:${end.character + 1}`;
}
