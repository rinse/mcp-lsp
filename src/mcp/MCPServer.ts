import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequest, CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, ServerResult } from '@modelcontextprotocol/sdk/types.js';

import { MCPTool } from '../tools/MCPTool.js';
import { logger } from '../utils/loggers.js';

export function createMCPServer(toolMap: Map<string, MCPTool>): Server {
  const server = new Server(
    {
      name: 'mcp-lsp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
      instructions: "", // TODO
    },
  );
  // Set up request handlers
  server.setRequestHandler(ListToolsRequestSchema, () => {
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
  return server;
}
