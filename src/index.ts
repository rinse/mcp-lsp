import { spawn } from 'child_process';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
  type CallToolRequest,
  type ListToolsRequest,
  type ServerResult,
} from '@modelcontextprotocol/sdk/types.js';

import { LSPManager } from './lsp/LSPManager.js';
import { LSPServerEx } from './lsp/LSPServerEx.js';
import { LSPServerExImpl } from './lsp/LSPServerExImpl.js';
import { LSPServerStdio } from './lsp/LSPServerStdio.js';
import { LSPTool } from './tools/LSPTool.js';
import { LSPToolHover } from './tools/LSPToolHover.js';
import { LSPToolRename } from './tools/LSPToolRename.js';
import { logger } from './utils/logger.js';

async function main() {
  // Spawn the TypeScript language server process
  const lspProcess = spawn('npx', ['typescript-language-server', '--stdio'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const lspServer = new LSPServerStdio(lspProcess);
  const lspServerEx: LSPServerEx = new LSPServerExImpl(lspServer);
  const lspManager = new LSPManager(lspServerEx);
  const toolMap = new Map<string, LSPTool>();
  // Register tools
  toolMap.set('hover', new LSPToolHover(lspManager));
  toolMap.set('rename', new LSPToolRename(lspManager));
  // MCP server instance
  const server = new Server(
    {
      name: 'mcp-lsp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );
    // Set up request handlers
  server.setRequestHandler(ListToolsRequestSchema, async (request: ListToolsRequest) => {
    return {
      tools: Array.from(toolMap.values()).map(tool => tool.listItem()),
    } satisfies ServerResult;
  });
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest, extra) => {
    logger.debug("[MCP] CallToolRequest received", { request, extra });
    const tool = toolMap.get(request.params.name);
    if (tool !== undefined) {
      return await tool.handle(request.params.arguments);
    }
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
  });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('MCP-LSP server running on stdio');
  // Start and initialize TypeScript LSP
  try {
    await lspServer.start();
    await lspServerEx.initialize({
      processId: process.pid,
      rootUri: `file://${process.cwd()}`,
      capabilities: {},
      trace: 'verbose',
    });
    await lspServerEx.initialized({});
    logger.info('TypeScript LSP initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize TypeScript LSP', { error });
  }
}

main().catch((error) => {
  logger.error('Server error', { error });
  process.exit(1);
});
