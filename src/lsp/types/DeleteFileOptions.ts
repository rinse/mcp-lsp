import { ChangeAnnotationIdentifier } from "./TextEdit";
import { DocumentUri } from "./Uri";

/**
 * Delete file options
 */
export interface DeleteFileOptions {
  /**
	 * Delete the content recursively if a folder is denoted.
	 */
  recursive?: boolean;

  /**
	 * Ignore the operation if the file doesn't exist.
	 */
  ignoreIfNotExists?: boolean;
}

/**
 * Delete file operation
 */
export interface DeleteFile {
  /**
	 * A delete
	 */
  kind: 'delete';

  /**
	 * The file to delete.
	 */
  uri: DocumentUri;

  /**
	 * Delete options.
	 */
  options?: DeleteFileOptions;

  /**
	 * An optional annotation identifier describing the operation.
	 *
	 * @since 3.16.0
	 */
  annotationId?: ChangeAnnotationIdentifier;
}
