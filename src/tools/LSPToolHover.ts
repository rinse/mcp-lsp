import {
    ErrorCode,
    McpError,
    type CallToolRequest,
    type CallToolResult,
    type TextContent,
    type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as t from "io-ts";
import { Hover } from "../lsp/types/HoverRequest";
import { MarkedStringT, markedStringToJsonString } from "../lsp/types/MarkedString";
import { MarkupContentT } from "../lsp/types/MarkupContent";
import { LSPTool } from "./LSPTool";
import { LSPManager } from "../lsp/LSPManager";

export class LSPToolHover implements LSPTool {
    constructor(private manager: LSPManager) {}

    listItem(): Tool {
        return listItemHover();
    }

    async handle(params: CallToolRequest["params"]["arguments"]): Promise<CallToolResult> {
        return handleHover(this.manager, params)
    }
}

function listItemHover(): Tool {
    return {
        name: 'hover',
        description: 'Get hover information for a position in a TypeScript file',
        inputSchema: {
            type: 'object',
            properties: {
                uri: {
                    type: 'string',
                    description: 'File URI (e.g., file:///path/to/file.ts)',
                },
                line: {
                    type: 'number',
                    description: 'Line number (0-based)',
                },
                character: {
                    type: 'number',
                    description: 'Character position (0-based)',
                },
            },
            required: ['uri', 'line', 'character'],
        },
    };
}

const HoverParamsT = t.type({
    uri: t.string,
    line: t.number,
    character: t.number,
});

async function handleHover(
    manager: LSPManager,
    params: CallToolRequest["params"]["arguments"],
): Promise<CallToolResult> {
    const decoded = HoverParamsT.decode(params);
    if (decoded._tag === 'Left') {
        throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for hover tool: ${JSON.stringify(decoded.left)}`);
    }
    const { uri, line, character } = decoded.right;
    try {
        const result = await manager.hover({
            textDocument: { uri },
            position: { line, character },
        });
        return result !== null
            ? hoverToCallToolResult(result)
            : hoverNothingContent();
    } catch (error) {
        throw new McpError(ErrorCode.InternalError, `Failed to get hover information: ${error}`);
    }
}

function hoverToCallToolResult(hover: Hover): CallToolResult {
    return {
        content: hoverToTextContents(hover),
    };
}

function hoverToTextContents(hover: Hover): TextContent[] {
    if (MarkedStringT.is(hover.contents)) {
        return [{
            type: 'text',
            text: markedStringToJsonString(hover.contents),
        }];
    }
    if (t.array(MarkedStringT).is(hover.contents)) {
        return hover.contents.map(markedString => ({
            type: 'text',
            text: markedStringToJsonString(markedString),
        }));
    }
    if (MarkupContentT.is(hover.contents)) {
        return [{
            type: 'text',
            text: hover.contents.value,
        }];
    }
    throw new McpError(
        ErrorCode.InternalError,
        `Unsupported hover content type: ${JSON.stringify(hover.contents)}`,
    );
}

function hoverNothingContent(): CallToolResult {
    return {
        content: [{
            type: 'text',
            text: 'No output.',
        }],
    };
}
