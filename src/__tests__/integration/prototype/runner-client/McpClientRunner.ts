import { ChildProcess } from 'child_process';
import { Either, left, right } from 'fp-ts/Either';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { TestRunner } from '../../TestRunner';

export class McpClientRunner implements TestRunner {
  private client: Client;
  private transport: StdioClientTransport;
  private isClosed = false;

  constructor() {
    // Create transport that will spawn the MCP server process
    this.transport = new StdioClientTransport({
      command: 'node',
      args: ['out/index.js'],
      stderr: 'pipe',
    });

    // Create client
    this.client = new Client(
      {
        name: 'mcp-client-test-runner',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );
  }

  async init(): Promise<void> {
    if (this.isClosed) {
      throw new Error('Runner is already closed');
    }

    try {
      // Connect client to transport
      await this.client.connect(this.transport);
    } catch (error) {
      throw new Error(`Failed to initialize MCP client: ${error}`);
    }
  }

  async close(): Promise<void> {
    if (this.isClosed) {
      return;
    }

    this.isClosed = true;

    try {
      await this.client.close();
      await this.transport.close();
      
      // Transport.close() leaks the inner process, so kill it manually
      const transportProcess = this.transport as unknown as { _process?: ChildProcess };
      if (transportProcess._process) {
        try {
          transportProcess._process.kill('SIGKILL');
        } catch (error) {
          console.error("Failed to kill the transport process", error);
        }
      }
    } catch (error) {
      // Log error but don't throw to ensure cleanup continues
      console.error('Error during MCP client cleanup:', error);
    }
  }

  async listTools(): Promise<Either<string, string>> {
    if (this.isClosed) {
      return left('Runner is closed');
    }

    try {
      const response = await this.client.listTools();
      
      if (!response.tools || response.tools.length === 0) {
        return left('No tools found');
      }

      const expectedOrder = [
        'get_hover_info',
        'list_definition_locations',
        'list_implementation_locations',
        'list_symbol_references',
        'get_type_declaration',
        'refactor_rename_symbol',
        'list_available_code_actions',
        'run_code_action',
        'list_caller_locations_of',
        'list_callee_locations_in'
      ];
      
      const toolNames = response.tools.map(tool => tool.name);
      const sortedTools = expectedOrder.filter(name => toolNames.includes(name));
      const toolList = `Available tools:\n${sortedTools.join('\n')}`;
      
      return right(toolList);
    } catch (error) {
      return left(`Failed to list tools: ${error}`);
    }
  }

  async runTool(toolName: string, args: Record<string, unknown>): Promise<Either<string, string>> {
    if (this.isClosed) {
      return left('Runner is closed');
    }

    try {
      const response = await this.client.callTool({
        name: toolName,
        arguments: args,
      }) as CallToolResult;

      if (!response.content || !Array.isArray(response.content) || response.content.length === 0) {
        return left('No content returned from tool');
      }

      // Extract text content from the response
      const textContent = response.content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('\n');

      return right(textContent);
    } catch (error) {
      return left(`Failed to run tool ${toolName}: ${error}`);
    }
  }
}