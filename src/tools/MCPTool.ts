import {
  type CallToolRequest,
  type CallToolResult,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

export interface MCPTool {
  listItem(): Tool,
  handle(params: CallToolRequest["params"]["arguments"]): Promise<CallToolResult>,
}
