import { CallHierarchyItem, SymbolKind } from "../../lsp/types/CallHierarchyRequest";

export function callHierarchyItemToString(item: CallHierarchyItem): string {
  const filePath = item.uri.replace('file://', '');
  const start = item.selectionRange.start;
  const position = `${filePath}:${start.line + 1}:${start.character + 1}`;
  const kind = symbolKindToString(item.kind);
  const detail = item.detail ? ` - ${item.detail}` : '';
  return `${item.name} (${kind}) at ${position}${detail}`;
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
