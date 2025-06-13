import { ChangeAnnotationIdentifier } from "./TextEdit";
import { DocumentUri } from "./Uri";

/**
 * Rename file options
 */
export interface RenameFileOptions {
  /**
	 * Overwrite target if existing. Overwrite wins over `ignoreIfExists`
	 */
  overwrite?: boolean;

  /**
	 * Ignores if target exists.
	 */
  ignoreIfExists?: boolean;
}

/**
 * Rename file operation
 */
export interface RenameFile {
  /**
	 * A rename
	 */
  kind: 'rename';

  /**
	 * The old (existing) location.
	 */
  oldUri: DocumentUri;

  /**
	 * The new location.
	 */
  newUri: DocumentUri;

  /**
	 * Rename options.
	 */
  options?: RenameFileOptions;

  /**
	 * An optional annotation identifier describing the operation.
	 *
	 * @since 3.16.0
	 */
  annotationId?: ChangeAnnotationIdentifier;
}
