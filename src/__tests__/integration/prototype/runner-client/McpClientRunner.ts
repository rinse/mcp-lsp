import { ChildProcess } from 'child_process';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Either, left, right } from 'fp-ts/Either';

import { EXPECTED_TOOL_ORDER } from './ToolNames';
import { isCallToolResult, isTextContent } from './TypeGuards';
import { TestRunner } from '../../TestRunner';

/**
 * MCPClientRunner provides direct integration with MCP server using the SDK client.
 *
 * IMPORTANT: This class follows the TestRunner interface pattern where construction
 * and initialization are separate. You MUST call init() before using any other methods.
 *
 * Usage:
 * ```typescript
 * const runner = new McpClientRunner();
 * await runner.init();
 * // ... use runner.listTools() and runner.runTool()
 * await runner.close();
 * ```
 */
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
      },
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
      throw new Error(`Failed to initialize MCP client: ${String(error)}`);
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

      // KNOWN LIMITATION: StdioClientTransport.close() may leak the spawned process
      // This is a workaround that accesses internal implementation details and may
      // break with SDK updates. This should be replaced with a proper SDK API when available.
      this._killTransportProcessSafely();
    } catch (error) {
      // Log error but don't throw to ensure cleanup continues
      console.error('Error during MCP client cleanup:', error);
    }
  }

  /**
   * Safely attempts to kill the transport process.
   *
   * WARNING: This method relies on internal implementation details of StdioClientTransport
   * and may break with future SDK updates. This is a known limitation due to process
   * leaking in the current SDK version.
   */
  private _killTransportProcessSafely(): void {
    try {
      const transportProcess = this.transport as unknown as { _process?: ChildProcess };
      if (transportProcess._process && !transportProcess._process.killed) {
        transportProcess._process.kill('SIGKILL');
      }
    } catch (error) {
      // Fail silently as this is a best-effort cleanup of internal resources
      console.error("Failed to kill transport process (this may be expected):", error);
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

      // Use tool names from actual implementations to avoid duplication
      const toolNames = response.tools.map(tool => tool.name);
      const sortedTools = EXPECTED_TOOL_ORDER.filter(name => toolNames.includes(name));
      const toolList = `Available tools:\n${sortedTools.join('\n')}`;

      return right(toolList);
    } catch (error) {
      return left(`Failed to list tools: ${String(error)}`);
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
      });

      // Validate response structure using type guard instead of unsafe casting
      if (!isCallToolResult(response)) {
        return left('Invalid response structure from tool');
      }

      if (!response.content || response.content.length === 0) {
        return left('No content returned from tool');
      }

      // Extract text content using type-safe filtering
      const textContent = response.content
        .filter(isTextContent)
        .map(item => item.text)
        .join('\n');

      return right(textContent);
    } catch (error) {
      return left(`Failed to run tool ${toolName}: ${String(error)}`);
    }
  }
}
