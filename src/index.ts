import { spawn, type ChildProcess } from 'child_process';

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { createLSPClientCapabilities } from './lsp/LSPClientCapabilities.js';
import { LSPManager } from './lsp/LSPManager.js';
import { LSPServerEx } from './lsp/LSPServerEx.js';
import { LSPServerExImpl } from './lsp/LSPServerExImpl.js';
import { LSPServerStream } from './lsp/LSPServerStream.js';
import { createMCPServer } from './mcp/MSPServer.js';
import { createToolMap } from './tools/ToolMap.js';
import { logger } from './utils/loggers.js';

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
    const toolMap = createToolMap(lspManager);
    // MCP server instance
    const mcpServer = createMCPServer(toolMap);
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
      capabilities: createLSPClientCapabilities(),
      trace: 'verbose',
    });
    logger.info('Result of initialize', { result: resultInitialize });
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
