import { parseArgs } from '../../../utils/cliParser';

describe('Custom LSP Command Integration', () => {
  describe('CLI argument parsing', () => {
    it('should use default TypeScript LSP when no command specified', () => {
      const args: string[] = [];
      const options = parseArgs(args);
      expect(options.getCommand()).toEqual(['typescript-language-server', '--stdio']);
    });

    it('should use custom LSP command when specified', () => {
      const args = ['--', 'rust-analyzer'];
      const options = parseArgs(args);
      expect(options.getCommand()).toEqual(['rust-analyzer']);
    });

    it('should handle both root-path and custom command', () => {
      const args = ['--root-path', '/home/user/project', '--', 'pylsp', '--log-file', '/tmp/pylsp.log'];
      const options = parseArgs(args);
      expect(options.getRootPath()).toBe('/home/user/project');
      expect(options.getCommand()).toEqual(['pylsp', '--log-file', '/tmp/pylsp.log']);
    });

    it('should maintain backward compatibility', () => {
      const args = ['--root-path', '/home/user/typescript-project'];
      const options = parseArgs(args);
      expect(options.getRootPath()).toBe('/home/user/typescript-project');
      expect(options.getCommand()).toEqual(['typescript-language-server', '--stdio']);
    });
  });

  describe('Example usage scenarios', () => {
    it('should handle Rust analyzer example', () => {
      const args = ['--root-path', '/home/user/rust-app', '--', 'rust-analyzer'];
      const options = parseArgs(args);
      expect(options.getRootPath()).toBe('/home/user/rust-app');
      expect(options.getCommand()).toEqual(['rust-analyzer']);
    });

    it('should handle Python LSP with additional arguments', () => {
      const args = ['--root-path', '/home/user/python-app', '--', 'pylsp', '--log-file', '/tmp/pylsp.log'];
      const options = parseArgs(args);
      expect(options.getRootPath()).toBe('/home/user/python-app');
      expect(options.getCommand()).toEqual(['pylsp', '--log-file', '/tmp/pylsp.log']);
    });

    it('should handle custom LSP without root path (using current directory)', () => {
      const args = ['--', 'gopls'];
      const options = parseArgs(args);
      expect(options.getRootPath()).toBe(process.cwd());
      expect(options.getCommand()).toEqual(['gopls']);
    });
  });
});
