import { parseArgs } from './cliParser';

describe('CLI Parser', () => {
  describe('parseArgs', () => {
    it('should extract --root-uri value when provided', () => {
      const args = ['--root-uri', 'file:///home/user/project'];
      const result = parseArgs(args);
      expect(result.rootUri).toBe('file:///home/user/project');
    });

    it('should return undefined for rootUri when --root-uri not provided', () => {
      const args: string[] = [];
      const result = parseArgs(args);
      expect(result.rootUri).toBeUndefined();
    });

    it('should validate that URI starts with file://', () => {
      const args = ['--root-uri', '/home/user/project'];
      expect(() => parseArgs(args)).toThrow('Root URI must start with file://');
    });

    it('should throw error for invalid URI format', () => {
      const args = ['--root-uri', 'http://example.com'];
      expect(() => parseArgs(args)).toThrow('Root URI must start with file://');
    });

    it('should handle multiple arguments correctly', () => {
      const args = ['--some-other-arg', 'value', '--root-uri', 'file:///path/to/project'];
      const result = parseArgs(args);
      expect(result.rootUri).toBe('file:///path/to/project');
    });

    it('should handle --root-uri with equals sign', () => {
      const args = ['--root-uri=file:///home/user/project'];
      const result = parseArgs(args);
      expect(result.rootUri).toBe('file:///home/user/project');
    });
  });
});
