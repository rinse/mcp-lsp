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

    it('should return provided path from getRootPath when root-path is set', () => {
      const args = ['--root-path', '/home/user/project'];
      const result = parseArgs(args);
      expect(result.getRootPath()).toBe('/home/user/project');
    });

    it('should return current working directory from getRootPath when no root-path provided', () => {
      const args: string[] = [];
      const result = parseArgs(args);
      expect(result.getRootPath()).toBe(process.cwd());
    });

    it('should safely handle string values for root-path', () => {
      const args = ['--root-path', '/valid/path'];
      const result = parseArgs(args);
      expect(result.rootPath).toBe('/valid/path');
      expect(result.getRootPath()).toBe('/valid/path');
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
      expect(result.getRootPath()).toBe('/path/to/project');
    });

    it('should handle --root-path with equals sign', () => {
      const args = ['--root-path=/home/user/project'];
      const result = parseArgs(args);
      expect(result.rootPath).toBe('/home/user/project');
      expect(result.getRootPath()).toBe('/home/user/project');
    });

    it('should handle help option correctly', () => {
      const args = ['--help'];
      const result = parseArgs(args);
      expect(result.help).toBe(true);
    });

    it('should handle short help option correctly', () => {
      const args = ['-h'];
      const result = parseArgs(args);
      expect(result.help).toBe(true);
    });

    it('should handle relative paths correctly', () => {
      const args = ['--root-path', './my-project'];
      const result = parseArgs(args);
      expect(result.rootPath).toBe('./my-project');
      expect(result.getRootPath()).toBe('./my-project');
    });
  });
});
