import { locationToString } from './utils';
import { Location } from '../lsp/types/Location';

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

    expect(result).toBe('/src/test.ts:10:5');
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

    expect(result).toBe('/src/test.ts:10:5-12:8');
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

    expect(result).toBe('/src/test.ts:10:5-10:11');
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

    expect(result).toBe('/src/test.ts:1:1');
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

    expect(result).toBe('/home/user/project/src/components/Button.tsx:43:16');
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

    expect(result).toBe('/C:/Users/dev/project/src/main.ts:6:3');
  });
});