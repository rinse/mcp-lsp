import { CallHierarchyItem, SymbolTag } from "../../lsp/types/CallHierarchyRequest";
import { Location } from "../../lsp/types/Location";
import { locationToString } from "../utils";

export function callHierarchyItemToString(item: CallHierarchyItem, range?: Location["range"]): string {
  let result = '';

  // Add tags if present
  if (item.tags && item.tags.length > 0) {
    const tagNames = item.tags.map(tag => tag === SymbolTag.Deprecated ? 'deprecated' : `tag${String(tag)}`);
    result += `[${tagNames.join(', ')}] `;
  }

  // Add name
  result += item.name;


  // Add location - use provided range or default to selectionRange
  const location: Location = {
    uri: item.uri,
    range: range ?? item.selectionRange,
  };
  result += ` at ${locationToString(location)}`;

  return result;
}

