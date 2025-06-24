import { MCPTool } from "./MCPTool.js";
import { MCPToolCallees } from "./MCPToolCallees.js";
import { MCPToolCallHierarchy } from "./MCPToolCallHierarchy.js";
import { MCPToolCodeAction } from "./MCPToolCodeAction.js";
import { MCPToolDefinition } from "./MCPToolDefinition.js";
import { MCPToolExecuteCodeAction } from "./MCPToolExecuteCodeAction.js";
import { MCPToolHover } from "./MCPToolHover.js";
import { MCPToolImplementation } from "./MCPToolImplementation.js";
import { MCPToolReferences } from "./MCPToolReferences.js";
import { MCPToolRename } from "./MCPToolRename.js";
import { MCPToolTypeDefinition } from "./MCPToolTypeDefinition.js";
import { LSPManager } from "../lsp/LSPManager.js";

export function createToolMap(lspManager: LSPManager): Map<string, MCPTool> {
  const tools = [
    new MCPToolHover(lspManager),
    new MCPToolDefinition(lspManager),
    new MCPToolImplementation(lspManager),
    new MCPToolReferences(lspManager),
    new MCPToolTypeDefinition(lspManager),
    new MCPToolRename(lspManager),
    new MCPToolCodeAction(lspManager),
    new MCPToolExecuteCodeAction(lspManager),
    new MCPToolCallHierarchy(lspManager),
    new MCPToolCallees(lspManager),
  ];

  const toolMap = new Map<string, MCPTool>();
  for (const tool of tools) {
    toolMap.set(tool.getName(), tool);
  }
  return toolMap;
}
