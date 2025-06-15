import { MCPTool } from "./MCPTool";
import { MCPToolCodeAction } from "./MCPToolCodeAction";
import { MCPToolDefinition } from "./MCPToolDefinition";
import { MCPToolExecuteCodeAction } from "./MCPToolExecuteCodeAction";
import { MCPToolHover } from "./MCPToolHover";
import { MCPToolImplementation } from "./MCPToolImplementation";
import { MCPToolIncomingCalls } from "./MCPToolIncomingCalls";
import { MCPToolOutgoingCalls } from "./MCPToolOutgoingCalls";
import { MCPToolPrepareCallHierarchy } from "./MCPToolPrepareCallHierarchy";
import { MCPToolReferences } from "./MCPToolReferences";
import { MCPToolRename } from "./MCPToolRename";
import { MCPToolTypeDefinition } from "./MCPToolTypeDefinition";
import { LSPManager } from "../lsp/LSPManager";

export function createToolMap(lspManager: LSPManager): Map<string, MCPTool> {
  const toolMap = new Map<string, MCPTool>();
  toolMap.set('hover', new MCPToolHover(lspManager));
  toolMap.set('definition', new MCPToolDefinition(lspManager));
  toolMap.set('implementation', new MCPToolImplementation(lspManager));
  toolMap.set('references', new MCPToolReferences(lspManager));
  toolMap.set('typeDefinition', new MCPToolTypeDefinition(lspManager));
  toolMap.set('rename', new MCPToolRename(lspManager));
  toolMap.set('prepareCallHierarchy', new MCPToolPrepareCallHierarchy(lspManager));
  toolMap.set('incomingCalls', new MCPToolIncomingCalls(lspManager));
  toolMap.set('outgoingCalls', new MCPToolOutgoingCalls(lspManager));
  toolMap.set('codeAction', new MCPToolCodeAction(lspManager));
  toolMap.set('executeCodeAction', new MCPToolExecuteCodeAction(lspManager));
  return toolMap;
}
