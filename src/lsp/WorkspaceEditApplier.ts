import * as fs from 'fs/promises';

import { ApplyWorkspaceEditResult } from './types/ApplyWorkspaceEditParams';
import { TextEdit } from './types/TextEdit';
import { WorkspaceEdit } from './types/WorkspaceEdit';
import { logger } from '../utils/logger';

export class WorkspaceEditApplier {
  async applyWorkspaceEdit(workspaceEdit: WorkspaceEdit): Promise<ApplyWorkspaceEditResult> {
    try {
      logger.info('[WorkspaceEditApplier] Applying workspace edit:', JSON.stringify(workspaceEdit, null, 2));

      if (!workspaceEdit.changes && !workspaceEdit.documentChanges) {
        logger.info('[WorkspaceEditApplier] Empty workspace edit, nothing to apply');
        return { applied: true };
      }

      // Handle simple changes format
      if (workspaceEdit.changes) {
        for (const [uri, edits] of Object.entries(workspaceEdit.changes)) {
          const filePath = this.uriToPath(uri);
          await this.applyTextEdits(filePath, edits);
        }
      }

      // Handle documentChanges format (more complex, not implemented yet)
      if (workspaceEdit.documentChanges) {
        logger.warn('[WorkspaceEditApplier] documentChanges not yet implemented');
        return {
          applied: false,
          failureReason: 'documentChanges format not yet supported',
        };
      }

      logger.info('[WorkspaceEditApplier] Successfully applied all edits');
      return { applied: true };
    } catch (error) {
      logger.error('[WorkspaceEditApplier] Failed to apply workspace edit:', error);
      return {
        applied: false,
        failureReason: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private uriToPath(uri: string): string {
    if (uri.startsWith('file://')) {
      return uri.substring(7);
    }
    return uri;
  }

  private async applyTextEdits(filePath: string, edits: TextEdit[]): Promise<void> {
    logger.debug(`[WorkspaceEditApplier] Applying ${edits.length} edits to ${filePath}`);

    // Read the file content
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Sort edits in reverse order (bottom to top, right to left) to avoid position shifts
    const sortedEdits = [...edits].sort((a, b) => {
      if (a.range.end.line !== b.range.end.line) {
        return b.range.end.line - a.range.end.line;
      }
      return b.range.end.character - a.range.end.character;
    });

    // Apply each edit
    for (const edit of sortedEdits) {
      const { range, newText } = edit;

      logger.debug(`[WorkspaceEditApplier] Applying edit at ${range.start.line}:${range.start.character} to ${range.end.line}:${range.end.character}`);

      // Handle single-line edit
      if (range.start.line === range.end.line) {
        const line = lines[range.start.line];
        lines[range.start.line] =
          line.substring(0, range.start.character) +
          newText +
          line.substring(range.end.character);
      } else {
        // Handle multi-line edit
        const startLine = lines[range.start.line];
        const endLine = lines[range.end.line];

        const newLines = newText.split('\n');
        const firstNewLine = startLine.substring(0, range.start.character) + newLines[0];
        const lastNewLine = newLines[newLines.length - 1] + endLine.substring(range.end.character);

        const replacementLines = [
          firstNewLine,
          ...newLines.slice(1, -1),
          ...(newLines.length > 1 ? [lastNewLine] : []),
        ];

        lines.splice(range.start.line, range.end.line - range.start.line + 1, ...replacementLines);
      }
    }

    // Write the modified content back
    const newContent = lines.join('\n');
    await fs.writeFile(filePath, newContent, 'utf-8');

    logger.info(`[WorkspaceEditApplier] Successfully applied ${edits.length} edits to ${filePath}`);
  }
}