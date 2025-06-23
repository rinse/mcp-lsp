import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Either, left, right } from 'fp-ts/Either';

import { TestRunner } from '../TestRunner.js';

interface Tool {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

interface ToolCallResult {
  content: {
    type: string;
    text?: string;
    [key: string]: unknown;
  }[];
}

export class MCPClientRunner implements TestRunner {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;

  constructor() {
    this.client = new Client(
      {
        name: 'mcp-client-test-runner',
        version: '1.0.0',
      },
      {
        capabilities: {},
      },
    );
  }

  private async connect(): Promise<void> {
    if (this.transport) {
      return; // Already connected
    }

    // Create transport that will spawn the server
    this.transport = new StdioClientTransport({
      command: 'node',
      args: ['out/index.js'],
      stderr: 'pipe',
    });

    // Connect the client
    await this.client!.connect(this.transport);
  }

  private async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }

    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
  }

  async listTools(): Promise<Either<string, string>> {
    try {
      await this.connect();

      const response = await this.client!.listTools();

      if (!response.tools || response.tools.length === 0) {
        return right('No tools found');
      }

      const toolNames = response.tools
        .map((tool: Tool) => tool.name)
        .join('\n');

      return right(`Available tools:\n${toolNames}`);
    } catch (error) {
      return left(`Failed to list tools: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await this.disconnect();
    }
  }

  async runTool(toolName: string, args: Record<string, unknown>): Promise<Either<string, string>> {
    try {
      await this.connect();

      const response = await this.client!.callTool({
        name: toolName,
        arguments: args,
      }) as ToolCallResult;

      if (!response.content || response.content.length === 0) {
        return right('No output from tool');
      }

      // Extract text content from the response
      const textContent = response.content
        .filter((item) => item.type === 'text')
        .map((item) => item.text ?? '')
        .join('\n');

      return right(textContent ?? JSON.stringify(response.content, null, 2));
    } catch (error) {
      return left(`Failed to run tool '${toolName}': ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await this.disconnect();
    }
  }
}

