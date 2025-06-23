import { exec } from 'child_process';

import { Either, left, right } from 'fp-ts/Either';

import { TestRunner } from '../TestRunner';

interface ToolListResponse {
  tools?: { name: string }[];
}

interface ToolCallResponse {
  content?: { type: string; text: string }[];
}

export class InspectorRunner implements TestRunner {
  private timeout = 10000; // 10 second timeout

  listTools(): Promise<Either<string, string>> {
    return new Promise((resolve) => {
      const command = 'timeout 8s npx @modelcontextprotocol/inspector --cli node out/index.js --method tools/list';

      exec(command, { timeout: this.timeout, killSignal: 'SIGKILL' }, (error, stdout) => {
        if (error) {
          // Check if it's a timeout or if we got output despite the error
          if (stdout?.trim()) {
            try {
              // Parse JSON response and extract tool names
              const response = JSON.parse(stdout) as ToolListResponse;
              const toolNames = response.tools?.map((tool) => tool.name).join('\n') ?? 'No tools found';
              resolve(right(`Available tools:\n${toolNames}`));
              return;
            } catch {
              resolve(right(stdout)); // Return raw output if JSON parsing fails
              return;
            }
          }
          resolve(left(`Inspector CLI failed: ${error.message}`));
          return;
        }

        try {
          // Parse JSON response and extract tool names
          const response = JSON.parse(stdout) as ToolListResponse;
          const toolNames = response.tools?.map((tool) => tool.name).join('\n') ?? 'No tools found';
          resolve(right(`Available tools:\n${toolNames}`));
        } catch {
          resolve(right(stdout)); // Return raw output if JSON parsing fails
        }
      });
    });
  }

  runTool(toolName: string, args: Record<string, unknown>): Promise<Either<string, string>> {
    return new Promise((resolve) => {
      // Build command with args
      const argString = Object.entries(args)
        .map(([key, value]) => `--tool-arg ${key}=${String(value)}`)
        .join(' ');

      const command = `timeout 8s npx @modelcontextprotocol/inspector --cli node out/index.js --method tools/call --tool-name ${toolName} ${argString}`;

      exec(command, { timeout: this.timeout, killSignal: 'SIGKILL' }, (error, stdout) => {
        if (error) {
          // Check if it's a timeout or if we got output despite the error
          if (stdout?.trim()) {
            try {
              // Try to parse as JSON first
              const response = JSON.parse(stdout) as ToolCallResponse;
              if (response.content && Array.isArray(response.content)) {
                // Extract text content from MCP response
                const textContent = response.content
                  .filter((item) => item.type === 'text')
                  .map((item) => item.text)
                  .join('\n');
                resolve(right(textContent || stdout));
                return;
              } else {
                resolve(right(stdout));
                return;
              }
            } catch {
              // If JSON parsing fails, return raw output
              resolve(right(stdout));
              return;
            }
          }
          resolve(left(`Inspector CLI failed: ${error.message}`));
          return;
        }

        try {
          // Try to parse as JSON first
          const response = JSON.parse(stdout) as ToolCallResponse;
          if (response.content && Array.isArray(response.content)) {
            // Extract text content from MCP response
            const textContent = response.content
              .filter((item) => item.type === 'text')
              .map((item) => item.text)
              .join('\n');
            resolve(right(textContent || stdout));
          } else {
            resolve(right(stdout));
          }
        } catch {
          // If JSON parsing fails, return raw output
          resolve(right(stdout));
        }
      });
    });
  }
}

