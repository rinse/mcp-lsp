import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Either, left, right } from 'fp-ts/Either';

import { TestRunner } from '../TestRunner.js';
import { ChildProcess } from 'child_process';

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
  private client: Client = new Client(
      {
        name: 'mcp-client-test-runner',
        version: '1.0.0',
      },
      {
        capabilities: {},
      },
    );

  private transport: StdioClientTransport = new StdioClientTransport({
    command: 'node',
    args: ['out/index.js'],
    stderr: 'pipe',
  });

  async init(): Promise<void> {
    await this.client.connect(this.transport);
  }

  async close(): Promise<void> {
    // Transport.close() leaks the inner process.
    const transportProcess = this.transport as unknown as { _process?: ChildProcess };
    if (transportProcess._process) {
      try {
        transportProcess._process.kill('SIGKILL');
      } catch (error) {
        console.error("Failed to kill the transport process", error);
      }
    }

    try {
      await this.client.close();
    } catch (error) {
      console.error("Failed to close the client.", error);
    }

    try {
      await this.transport.close();
    } catch (error) {
      console.error("Failed to close the transport.", error);
    }
  }

  async listTools(): Promise<Either<string, string>> {
    try {
      const response = await this.client.listTools();
      if (!response.tools || response.tools.length === 0) {
        return right('No tools found');
      }
      const toolNames = response.tools
        .map((tool: Tool) => tool.name)
        .join('\n');
      return right(`Available tools:\n${toolNames}`);
    } catch (error) {
      return left(`Failed to list tools: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async runTool(toolName: string, args: Record<string, unknown>): Promise<Either<string, string>> {
    try {
      const response = await this.client.callTool({
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
    }
  }
}

