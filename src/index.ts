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
import { createMCPServer } from './mcp/MCPServer.js';
import { createToolMap } from './tools/ToolMap.js';
import { logger } from './utils/loggers.js';

// Call the main function, disregarding a returned promise object.
void main();

async function main(): Promise<void> {
  logger.info("======================================");
  logger.info("[MCP] Server Process had started. ::::");
  logger.info("======================================");

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

  // MCP server instance
  const lspServer = new LSPServerStream(lspProcess.stdin, lspProcess.stdout);
  const lspServerEx: LSPServerEx = new LSPServerExImpl(lspServer);
  const lspManager = new LSPManager(lspServerEx);
  const toolMap = createToolMap(lspManager);
  const mcpServer = createMCPServer(toolMap);

  const preShutdownProcess = async () => {
    await safeClose("MCP Server", () => mcpServer.close());
    await safeClose("LSP Process", async () => { void lspProcess.kill(); });
    await safeClose("LSP Server", () => lspServer.close());
  };
  // Finish the process on EOF
  process.stdin.on("end", preShutdownProcess);
  // Graceful shutdown for signals
  for (const signal of ['SIGHUP', 'SIGINT', 'SIGTERM', 'exit', 'uncaughtException'] as const) {
    process.on(signal, preShutdownProcess);
  }

  try {
    // Start and initialize TypeScript LSP
    await lspServer.start();
    const resultInitialize = await lspServerEx.initialize({
      processId: process.pid,
      rootUri: `file://${process.cwd()}`,
      capabilities: createLSPClientCapabilities(),
      trace: 'verbose',
    });
    logger.info('[MCP] Result of LSP initialization', { result: resultInitialize });

    await lspServerEx.initialized({});
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    logger.info('[MCP] server running on stdio');
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to initialize LSP`, error);
  }
}

async function safeClose(name: string, close: () => Promise<void>) {
  try {
    logger.info(`[MCP] Closing ${name}.`)
    await close();
  } catch (error) {
    logger.error(`[MCP] Error during close ${name}`, { error });
  }
}
