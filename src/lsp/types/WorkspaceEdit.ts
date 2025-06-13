import * as t from 'io-ts';
import { CreateFile } from "./CreateFileOptions";
import { DeleteFile } from "./DeleteFileOptions";
import { RenameFile } from "./RenameFileOptions";
import { TextDocumentEdit } from "./TextDocumentEdit";
import { ChangeAnnotation, TextEdit, TextEditT } from "./TextEdit";
import { DocumentUri } from "./Uri";

export interface WorkspaceEdit {
	/**
	 * Holds changes to existing resources.
	 */
	changes?: { [uri: DocumentUri]: TextEdit[]; };

	/**
	 * Depending on the client capability
	 * `workspace.workspaceEdit.resourceOperations` document changes are either
	 * an array of `TextDocumentEdit`s to express changes to n different text
	 * documents where each text document edit addresses a specific version of
	 * a text document. Or it can contain above `TextDocumentEdit`s mixed with
	 * create, rename and delete file / folder operations.
	 *
	 * Whether a client supports versioned document edits is expressed via
	 * `workspace.workspaceEdit.documentChanges` client capability.
	 *
	 * If a client neither supports `documentChanges` nor
	 * `workspace.workspaceEdit.resourceOperations` then only plain `TextEdit`s
	 * using the `changes` property are supported.
	 */
	documentChanges?: (
		TextDocumentEdit[] |
		(TextDocumentEdit | CreateFile | RenameFile | DeleteFile)[]
	);

	/**
	 * A map of change annotations that can be referenced in
	 * `AnnotatedTextEdit`s or create, rename and delete file / folder
	 * operations.
	 *
	 * Whether clients honor this property depends on the client capability
	 * `workspace.changeAnnotationSupport`.
	 *
	 * @since 3.16.0
	 */
	changeAnnotations?: {
		[id: string /* ChangeAnnotationIdentifier */]: ChangeAnnotation;
	};
}

// WorkspaceEdit - simplified version with just changes
export const WorkspaceEditT = t.partial({
  changes: t.record(t.string, t.array(TextEditT)),
});
