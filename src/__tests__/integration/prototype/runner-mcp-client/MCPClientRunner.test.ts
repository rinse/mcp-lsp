import { isRight } from 'fp-ts/Either';

import { MCPClientRunner } from './MCPClientRunner';

describe('MCPClientRunner', () => {
  let runner: MCPClientRunner;

  beforeEach(() => {
    runner = new MCPClientRunner();
  });

  it('should be instantiable', () => {
    expect(runner).toBeInstanceOf(MCPClientRunner);
  });

  it('should list tools', async () => {
    const result = await runner.listTools();

    if (isRight(result)) {
      expect(result.right).toContain('Available tools:');
      // Should include at least one of our MCP tools
      expect(result.right).toMatch(/get_hover_info|list_definition_locations|list_implementation_locations/);
    } else {
      // If it fails, log the error for debugging
      console.error('Failed to list tools:', result.left);
      fail('Expected listTools to succeed');
    }
  }, 15000); // Increase timeout as we're spawning a process

  it('should handle tool call errors gracefully', async () => {
    const result = await runner.runTool('non_existent_tool', {});

    expect(isRight(result)).toBe(false);
    if (!isRight(result)) {
      expect(result.left).toContain('Failed to run tool');
    }
  }, 15000);
});
