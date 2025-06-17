import { callHierarchyItemToString } from './CallHierarchyItem';
import { CallHierarchyItem, SymbolKind } from '../../lsp/types/CallHierarchyRequest';

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

    expect(result).toBe('myFunction (Function) at /src/utils.ts:11:10');
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
      detail: 'RequestHandler',
    };

    const result = callHierarchyItemToString(item);

    expect(result).toBe('handleRequest (Method) at /src/server/RequestHandler.ts:26:9 - RequestHandler');
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
      detail: 'User',
    };

    const result = callHierarchyItemToString(item);

    expect(result).toBe('constructor (Constructor) at /src/models/User.ts:6:3 - User');
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

    expect(result).toBe('processData (Function) at /C:/Projects/app/src/processor.ts:16:10');
  });

  it('should handle different symbol kinds', () => {
    const testCases: { kind: SymbolKind; expected: string }[] = [
      { kind: SymbolKind.File, expected: 'File' },
      { kind: SymbolKind.Module, expected: 'Module' },
      { kind: SymbolKind.Namespace, expected: 'Namespace' },
      { kind: SymbolKind.Package, expected: 'Package' },
      { kind: SymbolKind.Class, expected: 'Class' },
      { kind: SymbolKind.Interface, expected: 'Interface' },
      { kind: SymbolKind.Variable, expected: 'Variable' },
      { kind: SymbolKind.Constant, expected: 'Constant' },
      { kind: SymbolKind.Property, expected: 'Property' },
      { kind: SymbolKind.Enum, expected: 'Enum' },
      { kind: SymbolKind.EnumMember, expected: 'EnumMember' },
    ];

    testCases.forEach(({ kind, expected }) => {
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
      expect(result).toBe(`testItem (${expected}) at /test.ts:1:1`);
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

    expect(result).toBe('simpleFunction (Function) at /src/simple.ts:1:10');
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

    expect(result).toBe('firstFunction (Function) at /src/first.ts:1:1');
  });

  it('should handle unknown symbol kinds', () => {
    const item: CallHierarchyItem = {
      name: 'unknownItem',
      kind: 999 as SymbolKind, // Invalid kind
      uri: 'file:///src/unknown.ts',
      range: {
        start: { line: 5, character: 2 },
        end: { line: 5, character: 15 },
      },
      selectionRange: {
        start: { line: 5, character: 2 },
        end: { line: 5, character: 13 },
      },
    };

    const result = callHierarchyItemToString(item);

    expect(result).toBe('unknownItem (Unknown(999)) at /src/unknown.ts:6:3');
  });
});
