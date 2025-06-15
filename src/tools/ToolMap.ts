import { MCPTool } from "./MCPTool.js";
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
  const toolMap = new Map<string, MCPTool>();
  toolMap.set('hover', new MCPToolHover(lspManager));
  toolMap.set('definition', new MCPToolDefinition(lspManager));
  toolMap.set('implementation', new MCPToolImplementation(lspManager));
  toolMap.set('references', new MCPToolReferences(lspManager));
  toolMap.set('typeDefinition', new MCPToolTypeDefinition(lspManager));
  toolMap.set('rename', new MCPToolRename(lspManager));
  toolMap.set('codeAction', new MCPToolCodeAction(lspManager));
  toolMap.set('executeCodeAction', new MCPToolExecuteCodeAction(lspManager));
  return toolMap;
}
