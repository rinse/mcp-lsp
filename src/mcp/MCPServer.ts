import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequest, CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, ServerResult } from '@modelcontextprotocol/sdk/types.js';

import { MCPTool } from '../tools/MCPTool.js';
import { logger } from '../utils/loggers.js';

export function createMCPServer(
  languageName: string,
  toolMap: Map<string, MCPTool>,
): Server {
  const server = new Server(
    {
      name: `${languageName} Code Assistant`,
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
      instructions: `Code Assistant provides various tools for reading / editing codes.

## You MUST use this MCP whenever:
- Finding a symbol based on a symbol
  * list_implementation_locations, list_symbol_references, list_caller_locations_of, get_type_declaration, etc.
- Renaming a symbol
  * refactor_rename_symbol
- Applying quick fix
  * Find an available imports for unresolved symbol.

## Locating a symbol
Tools often takes an accurate position of symbol. Locate a symbol with the following "awk trick":

\`\`\`
awk -v pat='<PATTERN>' '{pos=index($0, pat); if (pos) print NR-1 ":" pos-1 ":" $0}'
\`\`\`
`,
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
