import { parseArgs } from './cliParser';

describe('CLI Parser', () => {
  describe('parseArgs', () => {
    it('should extract --root-path value when provided', () => {
      const args = ['--root-path', '/home/user/project'];
      const result = parseArgs(args);
      expect(result.rootPath).toBe('/home/user/project');
    });

    it('should return undefined for rootPath when --root-path not provided', () => {
      const args: string[] = [];
      const result = parseArgs(args);
      expect(result.rootPath).toBeUndefined();
    });

    it('should convert absolute path to URI correctly', () => {
      const args = ['--root-path', '/home/user/project'];
      const result = parseArgs(args);
      expect(result.getRootUri()).toBe('file:///home/user/project');
    });

    it('should convert relative path to absolute URI correctly', () => {
      const originalCwd = process.cwd();
      const args = ['--root-path', './my-project'];
      const result = parseArgs(args);
      expect(result.getRootUri()).toBe(`file://${originalCwd}/./my-project`);
    });

    it('should return default URI when no root-path provided', () => {
      const args: string[] = [];
      const result = parseArgs(args);
      expect(result.getRootUri()).toBe(`file://${process.cwd()}`);
    });

    it('should reject URLs as root path', () => {
      const args = ['--root-path', 'http://example.com'];
      expect(() => parseArgs(args)).toThrow('Root path must be a file system path, not a URL');
    });

    it('should reject HTTPS URLs as root path', () => {
      const args = ['--root-path', 'https://example.com'];
      expect(() => parseArgs(args)).toThrow('Root path must be a file system path, not a URL');
    });

    it('should handle multiple arguments correctly', () => {
      const args = ['--some-other-arg', 'value', '--root-path', '/path/to/project'];
      const result = parseArgs(args);
      expect(result.rootPath).toBe('/path/to/project');
      expect(result.getRootUri()).toBe('file:///path/to/project');
    });

    it('should handle --root-path with equals sign', () => {
      const args = ['--root-path=/home/user/project'];
      const result = parseArgs(args);
      expect(result.rootPath).toBe('/home/user/project');
      expect(result.getRootUri()).toBe('file:///home/user/project');
    });

    it('should handle help option correctly', () => {
      const args = ['--help'];
      const result = parseArgs(args);
      expect(result.help).toBe(true);
    });
  });
});
