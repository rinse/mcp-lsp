import { spawn, type ChildProcess } from 'child_process';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
  type CallToolRequest,
  type ServerResult,
} from '@modelcontextprotocol/sdk/types.js';

import { LSPManager } from './lsp/LSPManager.js';
import { LSPServerEx } from './lsp/LSPServerEx.js';
import { LSPServerExImpl } from './lsp/LSPServerExImpl.js';
import { LSPServerStream } from './lsp/LSPServerStream.js';
import { ClientCapabilities } from './lsp/types/clientcapabilities/ClientCapabilities.js';
import { MCPTool } from './tools/MCPTool.js';
import { MCPToolCodeAction } from './tools/MCPToolCodeAction.js';
import { MCPToolDefinition } from './tools/MCPToolDefinition.js';
import { MCPToolHover } from './tools/MCPToolHover.js';
import { MCPToolImplementation } from './tools/MCPToolImplementation.js';
import { MCPToolReferences } from './tools/MCPToolReferences.js';
import { MCPToolRename } from './tools/MCPToolRename.js';
import { MCPToolTypeDefinition } from './tools/MCPToolTypeDefinition.js';
import { logger } from './utils/logger.js';

// Call the main function, disregarding a returned promise object.
void main();

async function main(): Promise<void> {
  // Spawn the TypeScript language server process
  const lspProcess = spawn('npx', ['typescript-language-server', '--stdio'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  lspProcess.on('error', (error) => {
    logger.error('[LSP] Process error', { error });
  });
  lspProcess.on('exit', (code, signal) => {
    logger.info('[LSP] Process exited', { code, signal });
    throw new McpError(ErrorCode.InternalError, `LSP Process exited.`);
  });
  const lspServer = new LSPServerStream(lspProcess.stdin, lspProcess.stdout);
  try {
    const lspServerEx: LSPServerEx = new LSPServerExImpl(lspServer);
    const lspManager = new LSPManager(lspServerEx);
    const toolMap = new Map<string, MCPTool>();
    // Register tools
    toolMap.set('hover', new MCPToolHover(lspManager));
    toolMap.set('definition', new MCPToolDefinition(lspManager));
    toolMap.set('implementation', new MCPToolImplementation(lspManager));
    toolMap.set('references', new MCPToolReferences(lspManager));
    toolMap.set('typeDefinition', new MCPToolTypeDefinition(lspManager));
    toolMap.set('rename', new MCPToolRename(lspManager));
    toolMap.set('codeAction', new MCPToolCodeAction(lspManager));
    // MCP server instance
    const mcpServer = new Server(
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
    mcpServer.setRequestHandler(ListToolsRequestSchema, () => {
      return {
        tools: Array.from(toolMap.values()).map(tool => tool.listItem()),
      } satisfies ServerResult;
    });
    mcpServer.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest, extra) => {
      logger.debug("[MCP] CallToolRequest received", { request, extra });
      const tool = toolMap.get(request.params.name);
      if (tool !== undefined) {
        return await tool.handle(request.params.arguments);
      }
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
    });
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    logger.info('MCP-LSP server running on stdio');
    // Register cleanup handlers
    process.on('SIGINT', () => void cleanup(lspServer, lspProcess));
    process.on('SIGTERM', () => void cleanup(lspServer, lspProcess));
    process.on('exit', () => void cleanup(lspServer, lspProcess));
    // Start and initialize TypeScript LSP
    await lspServer.start();
    const resultInitialize = await lspServerEx.initialize({
      processId: process.pid,
      rootUri: `file://${process.cwd()}`,
      capabilities: {
        workspace: {
          workspaceEdit: {
            documentChanges: false,
            resourceOperations: ['create', 'rename', 'delete'],
          },
        },
      } satisfies ClientCapabilities,
      trace: 'verbose',
    });
    logger.info('Result of initialize:', resultInitialize);
    await lspServerEx.initialized({});
    logger.info('TypeScript LSP initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize TypeScript LSP', { error });
    await cleanup(lspServer, lspProcess);
    process.exit(1);
  }
}

async function cleanup(lspServer: LSPServerStream, lspProcess: ChildProcess): Promise<void> {
  try {
    await lspServer.close();
  } catch (error) {
    logger.error('[LSP] Error during server close', { error });
  }
  lspProcess.kill();
};
