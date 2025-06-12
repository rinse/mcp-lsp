import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequest,
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequest,
    ListToolsRequestSchema,
    McpError,
    type ServerResult,
} from '@modelcontextprotocol/sdk/types.js';
import { LSPServerStdio } from './lsp/LSPServerStdio.js';
import { spawn } from 'child_process';
import { LSPRequester } from './lsp/LSPRequester.js';
import { LSPToolHover } from './tools/hover.js';
import { LSPRequesterImpl } from './lsp/LSPRequesterImpl.js';
import { LSPTool } from './tools/LSPTool.js';

async function main() {
    // Spawn the TypeScript language server process
    const lspProcess = spawn('npx', ['typescript-language-server', '--stdio'], {
        stdio: ['pipe', 'pipe', 'pipe']
    });
    const lspServer = new LSPServerStdio(lspProcess);
    const lspRequester: LSPRequester = new LSPRequesterImpl(lspServer);
    const toolMap = new Map<string, LSPTool>();
    // Register tools
    toolMap.set('hover', new LSPToolHover(lspRequester));
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
        console.error("[MCP] CallToolRequest received:", request, "extra:", extra);
        const tool = toolMap.get(request.params.name);
        if (tool !== undefined) {
            return await tool.handle(request.params.arguments);
        }
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP-LSP server running on stdio');
    // Start and initialize TypeScript LSP
    try {
        await lspServer.start();
        const rootUri = `file://${process.cwd()}`;
        await lspRequester.initialize(rootUri);
        console.error('TypeScript LSP initialized successfully');
    } catch (error) {
        console.error('Failed to initialize TypeScript LSP:', error);
    }
}

main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
