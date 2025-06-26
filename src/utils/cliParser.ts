import { parseArgs as nodeParseArgs } from 'node:util';

export interface CLIOptions {
  rootPath?: string;
  help?: boolean;
  getRootPath(): string;
}

export function parseArgs(args: string[]): CLIOptions {
  const { values } = nodeParseArgs({
    args,
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
    getRootPath(): string {
      return rootPath ?? process.cwd();
    },
  };

  if (values.help) {
    return options;
  }

  return options;
}

export function showHelp(): void {
  console.log(`
mcp-lsp - MCP server that bridges TypeScript Language Server Protocol

Usage: mcp-lsp [options]

Options:
  --root-path <path>  Specify the root path for the TypeScript LSP server
                      Can be absolute or relative path
                      Default: current working directory
  -h, --help          Show this help message

Examples:
  mcp-lsp --root-path /home/user/my-project
  mcp-lsp --root-path ./my-project
  mcp-lsp --root-path ~/projects/my-app
`);
}
