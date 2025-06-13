import { ChangeAnnotationIdentifier } from "./TextEdit";
import { DocumentUri } from "./Uri";

/**
 * Options to create a file.
 */
export interface CreateFileOptions {
  /**
	 * Overwrite existing file. Overwrite wins over `ignoreIfExists`
	 */
  overwrite?: boolean;

  /**
	 * Ignore if exists.
	 */
  ignoreIfExists?: boolean;
}

/**
 * Create file operation
 */
export interface CreateFile {
  /**
	 * A create
	 */
  kind: 'create';

  /**
	 * The resource to create.
	 */
  uri: DocumentUri;

  /**
	 * Additional options
	 */
  options?: CreateFileOptions;

  /**
	 * An optional annotation identifier describing the operation.
	 *
	 * @since 3.16.0
	 */
  annotationId?: ChangeAnnotationIdentifier;
}
