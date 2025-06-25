import { parseArgs as nodeParseArgs } from 'node:util';

export interface CLIOptions {
  rootUri?: string;
  help?: boolean;
}

export function parseArgs(args: string[]): CLIOptions {
  const { values } = nodeParseArgs({
    args,
    options: {
      'root-uri': {
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

  const options: CLIOptions = {};

  if (values.help) {
    options.help = true;
    return options;
  }

  if (values['root-uri']) {
    const rootUri = values['root-uri'] as string;
    if (!rootUri.startsWith('file://')) {
      throw new Error('Root URI must start with file://');
    }
    options.rootUri = rootUri;
  }

  return options;
}

export function showHelp(): void {
  console.log(`
mcp-lsp - MCP server that bridges TypeScript Language Server Protocol

Usage: mcp-lsp [options]

Options:
  --root-uri <uri>    Specify the root URI for the TypeScript LSP server
                      Must start with file://
                      Default: file://\${process.cwd()}
  -h, --help          Show this help message

Example:
  mcp-lsp --root-uri file:///home/user/my-project
`);
}
