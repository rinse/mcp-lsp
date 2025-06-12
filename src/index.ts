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
import { LSPServerStdio } from './lsp/LSPServerStdio.js';
import { spawn } from 'child_process';
import { LSPServerEx } from './lsp/LSPServerEx.js';
import { LSPToolHover } from './tools/LSPToolHover.js';
import { LSPToolRename } from './tools/LSPToolRename.js';
import { LSPServerExImpl } from './lsp/LSPServerExImpl.js';
import { LSPTool } from './tools/LSPTool.js';
import { LSPManager } from './lsp/LSPManager.js';

async function main() {
    // Spawn the TypeScript language server process
    const lspProcess = spawn('npx', ['typescript-language-server', '--stdio'], {
        stdio: ['pipe', 'pipe', 'pipe']
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
        await lspServerEx.initialize({
            processId: process.pid,
            rootUri: `file://${process.cwd()}`,
            capabilities: {},
            trace: 'verbose'
        });
        await lspServerEx.initialized({});
        console.error('TypeScript LSP initialized successfully');
    } catch (error) {
        console.error('Failed to initialize TypeScript LSP:', error);
    }
}

main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
