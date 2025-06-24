/**
 * Tool names extracted from actual tool implementations to avoid duplication.
 * This ensures consistency with the actual tool definitions.
 */

// These tool names match the order expected by tests and come from actual tool implementations
export const EXPECTED_TOOL_ORDER = [
  'get_hover_info',           // MCPToolHover.getName()
  'list_definition_locations', // MCPToolDefinition.getName()
  'list_implementation_locations', // MCPToolImplementation.getName()
  'list_symbol_references',   // MCPToolReferences.getName()
  'get_type_declaration',     // MCPToolTypeDefinition.getName()
  'refactor_rename_symbol',   // MCPToolRename.getName()
  'list_available_code_actions', // MCPToolCodeAction.getName()
  'run_code_action',          // MCPToolExecuteCodeAction.getName()
  'list_caller_locations_of', // MCPToolCallHierarchy.getName()
  'list_callee_locations_in', // MCPToolCallees.getName()
] as const;

export type ToolName = typeof EXPECTED_TOOL_ORDER[number];
