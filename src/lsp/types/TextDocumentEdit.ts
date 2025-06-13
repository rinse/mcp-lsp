import { AnnotatedTextEdit, TextEdit } from "./TextEdit";
import { OptionalVersionedTextDocumentIdentifier } from "./VersionedTextDocumentIdentifier";

export interface TextDocumentEdit {
  /**
	 * The text document to change.
	 */
  textDocument: OptionalVersionedTextDocumentIdentifier;

  /**
	 * The edits to be applied.
	 *
	 * @since 3.16.0 - support for AnnotatedTextEdit. This is guarded by the
	 * client capability `workspace.workspaceEdit.changeAnnotationSupport`
	 */
  edits: (TextEdit | AnnotatedTextEdit)[];
}
