import { CallHierarchyItem, SymbolKind, SymbolTag } from "../../lsp/types/CallHierarchyRequest";
import { Location } from "../../lsp/types/Location";
import { locationToString } from "../utils";

export function callHierarchyItemToString(item: CallHierarchyItem, range?: Location["range"]): string {
  let result = '';
  
  // Add tags if present
  if (item.tags && item.tags.length > 0) {
    const tagNames = item.tags.map(tag => tag === SymbolTag.Deprecated ? 'deprecated' : `tag${tag}`);
    result += `[${tagNames.join(', ')}] `;
  }
  
  // Add name
  result += item.name;
  
  // Add detail if present (signature)
  if (item.detail) {
    result += `(${item.detail}`;
  }
  
  // Add location - use provided range or default to selectionRange
  const location: Location = {
    uri: item.uri,
    range: range || item.selectionRange,
  };
  result += ` at ${locationToString(location)}`;
  
  return result;
}

function symbolKindToString(kind: SymbolKind): string {
  const kinds: Record<number, string> = {
    1: 'File',
    2: 'Module',
    3: 'Namespace',
    4: 'Package',
    5: 'Class',
    6: 'Method',
    7: 'Property',
    8: 'Field',
    9: 'Constructor',
    10: 'Enum',
    11: 'Interface',
    12: 'Function',
    13: 'Variable',
    14: 'Constant',
    15: 'String',
    16: 'Number',
    17: 'Boolean',
    18: 'Array',
    19: 'Object',
    20: 'Key',
    21: 'Null',
    22: 'EnumMember',
    23: 'Struct',
    24: 'Event',
    25: 'Operator',
    26: 'TypeParameter',
  };
  return kinds[kind] || `Unknown(${kind})`;
}
