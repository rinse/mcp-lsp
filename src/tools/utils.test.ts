import { locationToString, rangeToString } from './utils';
import { Location } from '../lsp/types/Location';
import { Range } from '../lsp/types/Range';

describe('locationToString', () => {
  it('should format single-position location correctly', () => {
    const location: Location = {
      uri: 'file:///src/test.ts',
      range: {
        start: { line: 9, character: 4 },
        end: { line: 9, character: 4 },
      },
    };

    const result = locationToString(location);

    expect(result).toBe('/src/test.ts:9:4');
  });

  it('should format range location correctly', () => {
    const location: Location = {
      uri: 'file:///src/test.ts',
      range: {
        start: { line: 9, character: 4 },
        end: { line: 11, character: 7 },
      },
    };

    const result = locationToString(location);

    expect(result).toBe('/src/test.ts:9:4-11:7');
  });

  it('should format same-line range correctly', () => {
    const location: Location = {
      uri: 'file:///src/test.ts',
      range: {
        start: { line: 9, character: 4 },
        end: { line: 9, character: 10 },
      },
    };

    const result = locationToString(location);

    expect(result).toBe('/src/test.ts:9:4-9:10');
  });

  it('should handle zero-based line and character positions', () => {
    const location: Location = {
      uri: 'file:///src/test.ts',
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
    };

    const result = locationToString(location);

    expect(result).toBe('/src/test.ts:0:0');
  });

  it('should handle complex file paths', () => {
    const location: Location = {
      uri: 'file:///home/user/project/src/components/Button.tsx',
      range: {
        start: { line: 42, character: 15 },
        end: { line: 42, character: 15 },
      },
    };

    const result = locationToString(location);

    expect(result).toBe('/home/user/project/src/components/Button.tsx:42:15');
  });

  it('should handle Windows-style paths', () => {
    const location: Location = {
      uri: 'file:///C:/Users/dev/project/src/main.ts',
      range: {
        start: { line: 5, character: 2 },
        end: { line: 5, character: 2 },
      },
    };

    const result = locationToString(location);

    expect(result).toBe('/C:/Users/dev/project/src/main.ts:5:2');
  });
});

describe('rangeToString', () => {
  it('should format single-position range correctly', () => {
    const range: Range = {
      start: { line: 9, character: 4 },
      end: { line: 9, character: 4 },
    };

    const result = rangeToString(range);

    expect(result).toBe('9:4');
  });

  it('should format multi-line range correctly', () => {
    const range: Range = {
      start: { line: 9, character: 4 },
      end: { line: 11, character: 7 },
    };

    const result = rangeToString(range);

    expect(result).toBe('9:4-11:7');
  });

  it('should format same-line range with different positions correctly', () => {
    const range: Range = {
      start: { line: 9, character: 4 },
      end: { line: 9, character: 10 },
    };

    const result = rangeToString(range);

    expect(result).toBe('9:4-9:10');
  });

  it('should handle zero-based positions', () => {
    const range: Range = {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
    };

    const result = rangeToString(range);

    expect(result).toBe('0:0');
  });

  it('should handle large line and character numbers', () => {
    const range: Range = {
      start: { line: 999, character: 120 },
      end: { line: 1005, character: 15 },
    };

    const result = rangeToString(range);

    expect(result).toBe('999:120-1005:15');
  });

  it('should handle single-character range on same line', () => {
    const range: Range = {
      start: { line: 5, character: 10 },
      end: { line: 5, character: 11 },
    };

    const result = rangeToString(range);

    expect(result).toBe('5:10-5:11');
  });
});

