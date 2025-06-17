import { callHierarchyItemToString } from './CallHierarchyItem';
import { CallHierarchyItem, SymbolKind, SymbolTag } from '../../lsp/types/CallHierarchyRequest';

describe('callHierarchyItemToString', () => {
  it('should format a function item correctly', () => {
    const item: CallHierarchyItem = {
      name: 'myFunction',
      kind: SymbolKind.Function,
      uri: 'file:///src/utils.ts',
      range: {
        start: { line: 10, character: 0 },
        end: { line: 15, character: 0 },
      },
      selectionRange: {
        start: { line: 10, character: 9 },
        end: { line: 10, character: 19 },
      },
    };

    const result = callHierarchyItemToString(item);

    expect(result).toBe('myFunction at /src/utils.ts:10:9-10:19');
  });

  it('should format a method item with detail correctly', () => {
    const item: CallHierarchyItem = {
      name: 'handleRequest',
      kind: SymbolKind.Method,
      uri: 'file:///src/server/RequestHandler.ts',
      range: {
        start: { line: 25, character: 2 },
        end: { line: 30, character: 2 },
      },
      selectionRange: {
        start: { line: 25, character: 8 },
        end: { line: 25, character: 21 },
      },
      detail: 'req: Request, res: Response',
    };

    const result = callHierarchyItemToString(item);

    expect(result).toBe('handleRequest at /src/server/RequestHandler.ts:25:8-25:21');
  });

  it('should format a class constructor correctly', () => {
    const item: CallHierarchyItem = {
      name: 'constructor',
      kind: SymbolKind.Constructor,
      uri: 'file:///src/models/User.ts',
      range: {
        start: { line: 5, character: 2 },
        end: { line: 10, character: 2 },
      },
      selectionRange: {
        start: { line: 5, character: 2 },
        end: { line: 5, character: 13 },
      },
      detail: 'name: string, age: number',
    };

    const result = callHierarchyItemToString(item);

    expect(result).toBe('constructor at /src/models/User.ts:5:2-5:13');
  });

  it('should handle Windows-style file URIs', () => {
    const item: CallHierarchyItem = {
      name: 'processData',
      kind: SymbolKind.Function,
      uri: 'file:///C:/Projects/app/src/processor.ts',
      range: {
        start: { line: 15, character: 0 },
        end: { line: 20, character: 0 },
      },
      selectionRange: {
        start: { line: 15, character: 9 },
        end: { line: 15, character: 20 },
      },
    };

    const result = callHierarchyItemToString(item);

    expect(result).toBe('processData at /C:/Projects/app/src/processor.ts:15:9-15:20');
  });

  it('should handle different symbol kinds', () => {
    const testCases: SymbolKind[] = [
      SymbolKind.File,
      SymbolKind.Module,
      SymbolKind.Namespace,
      SymbolKind.Package,
      SymbolKind.Class,
      SymbolKind.Interface,
      SymbolKind.Variable,
      SymbolKind.Constant,
      SymbolKind.Property,
      SymbolKind.Enum,
      SymbolKind.EnumMember,
    ];

    testCases.forEach((kind) => {
      const item: CallHierarchyItem = {
        name: 'testItem',
        kind,
        uri: 'file:///test.ts',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 10 },
        },
        selectionRange: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 8 },
        },
      };

      const result = callHierarchyItemToString(item);
      expect(result).toBe(`testItem at /test.ts:0:0-0:8`);
    });
  });

  it('should handle items without detail field', () => {
    const item: CallHierarchyItem = {
      name: 'simpleFunction',
      kind: SymbolKind.Function,
      uri: 'file:///src/simple.ts',
      range: {
        start: { line: 0, character: 0 },
        end: { line: 5, character: 0 },
      },
      selectionRange: {
        start: { line: 0, character: 9 },
        end: { line: 0, character: 23 },
      },
    };

    const result = callHierarchyItemToString(item);

    expect(result).toBe('simpleFunction at /src/simple.ts:0:9-0:23');
  });

  it('should handle zero-based positions correctly', () => {
    const item: CallHierarchyItem = {
      name: 'firstFunction',
      kind: SymbolKind.Function,
      uri: 'file:///src/first.ts',
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 20 },
      },
      selectionRange: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 13 },
      },
    };

    const result = callHierarchyItemToString(item);

    expect(result).toBe('firstFunction at /src/first.ts:0:0-0:13');
  });

  it('should handle deprecated items with tags', () => {
    const item: CallHierarchyItem = {
      name: 'deprecatedFunction',
      kind: SymbolKind.Function,
      uri: 'file:///src/deprecated.ts',
      range: {
        start: { line: 10, character: 0 },
        end: { line: 15, character: 0 },
      },
      selectionRange: {
        start: { line: 10, character: 9 },
        end: { line: 10, character: 27 },
      },
      tags: [SymbolTag.Deprecated],
      detail: 'message: string',
    };

    const result = callHierarchyItemToString(item);

    expect(result).toBe('[deprecated] deprecatedFunction at /src/deprecated.ts:10:9-10:27');
  });

  it('should ignore detail field and format simply', () => {
    // Test that detail field is ignored for cleaner output
    const itemWithDetail: CallHierarchyItem = {
      name: 'processData',
      kind: SymbolKind.Function,
      uri: 'file:///src/processor.ts',
      range: {
        start: { line: 10, character: 0 },
        end: { line: 15, character: 0 },
      },
      selectionRange: {
        start: { line: 10, character: 9 },
        end: { line: 10, character: 20 },
      },
      detail: 'data: string, options: Options',
    };

    const result = callHierarchyItemToString(itemWithDetail);
    expect(result).toBe('processData at /src/processor.ts:10:9-10:20');
    
    // Ensure detail is not included
    expect(result).not.toContain('data: string');
  });

  it('should handle custom range parameter', () => {
    const item: CallHierarchyItem = {
      name: 'myMethod',
      kind: SymbolKind.Method,
      uri: 'file:///src/test.ts',
      range: {
        start: { line: 20, character: 2 },
        end: { line: 25, character: 2 },
      },
      selectionRange: {
        start: { line: 20, character: 8 },
        end: { line: 20, character: 16 },
      },
    };

    const customRange = {
      start: { line: 22, character: 4 },
      end: { line: 22, character: 20 },
    };

    const result = callHierarchyItemToString(item, customRange);

    expect(result).toBe('myMethod at /src/test.ts:22:4-22:20');
  });
});
