import { parseArgs as nodeParseArgs } from 'node:util';

export interface CLIOptions {
  rootPath?: string;
  help?: boolean;
  command?: string[];
  getRootPath(): string;
  getCommand(): string[];
}

export function parseArgs(args: string[]): CLIOptions {
  // Find the -- separator
  const separatorIndex = args.indexOf('--');
  let commandArgs: string[] | undefined;
  let optionArgs = args;

  if (separatorIndex !== -1) {
    // Split args at --
    optionArgs = args.slice(0, separatorIndex);
    commandArgs = args.slice(separatorIndex + 1);
  }

  const { values } = nodeParseArgs({
    args: optionArgs,
    options: {
      'root-path': {
        type: 'string',
      },
      'help': {
        type: 'boolean',
        short: 'h',
      },
    },
    strict: false,
    allowPositionals: true,
  });

  let rootPath: string | undefined;

  if (values['root-path']) {
    // Safe type checking before assignment
    const rawValue = values['root-path'];
    if (typeof rawValue === 'string') {
      rootPath = rawValue;
      // Basic validation - check if path exists or seems valid
      if (rootPath.startsWith('http://') || rootPath.startsWith('https://')) {
        throw new Error('Root path must be a file system path, not a URL');
      }
    } else {
      throw new Error('Root path must be a string value');
    }
  }

  const options: CLIOptions = {
    rootPath,
    help: Boolean(values.help),
    command: commandArgs,
    getRootPath(): string {
      return rootPath ?? process.cwd();
    },
    getCommand(): string[] {
      return commandArgs ?? ['typescript-language-server', '--stdio'];
    },
  };

  if (values.help) {
    return options;
  }

  return options;
}

export function showHelp(): void {
  console.log(`
mcp-lsp - MCP server that bridges Language Server Protocol to MCP tools

Usage: mcp-lsp [options] [-- <lsp-command> [args...]]

Options:
  --root-path <path>  Specify the root path for the LSP server
                      Can be absolute or relative path
                      Default: current working directory
  -h, --help          Show this help message

Arguments:
  <lsp-command>       Custom LSP server command to execute
                      Default: typescript-language-server --stdio

Examples:
  # Use default TypeScript LSP
  mcp-lsp --root-path /home/user/my-project

  # Use Rust analyzer with custom root
  mcp-lsp --root-path /home/user/rust-app -- rust-analyzer

  # Use Python LSP with additional arguments
  mcp-lsp --root-path /home/user/python-app -- pylsp --log-file /tmp/pylsp.log

  # Use custom LSP without specifying root path (uses current directory)
  mcp-lsp -- gopls
`);
}
