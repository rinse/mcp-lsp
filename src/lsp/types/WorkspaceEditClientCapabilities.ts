export interface WorkspaceEditClientCapabilities {
  /**
	 * The client supports versioned document changes in `WorkspaceEdit`s
	 */
  documentChanges?: boolean;

  /**
	 * The resource operations the client supports. Clients should at least
	 * support 'create', 'rename' and 'delete' files and folders.
	 *
	 * @since 3.13.0
	 */
  resourceOperations?: ResourceOperationKind[];

  /**
	 * The failure handling strategy of a client if applying the workspace edit
	 * fails.
	 *
	 * @since 3.13.0
	 */
  failureHandling?: FailureHandlingKind;

  /**
	 * Whether the client normalizes line endings to the client specific
	 * setting.
	 * If set to `true` the client will normalize line ending characters
	 * in a workspace edit to the client specific new line character(s).
	 *
	 * @since 3.16.0
	 */
  normalizesLineEndings?: boolean;

  /**
	 * Whether the client in general supports change annotations on text edits,
	 * create file, rename file and delete file changes.
	 *
	 * @since 3.16.0
	 */
  changeAnnotationSupport?: {
    /**
		 * Whether the client groups edits with equal labels into tree nodes,
		 * for instance all edits labelled with "Changes in Strings" would
		 * be a tree node.
		 */
    groupsOnLabel?: boolean;
  };
}

/**
 * The kind of resource operations supported by the client.
 */
export type ResourceOperationKind = 'create' | 'rename' | 'delete';

export const ResourceOperationKind = {

  /**
	 * Supports creating new files and folders.
	 */
  Create: 'create' as const,

  /**
	 * Supports renaming existing files and folders.
	 */
  Rename: 'rename' as const,

  /**
	 * Supports deleting existing files and folders.
	 */
  Delete: 'delete' as const,
} as const;

export type FailureHandlingKind = 'abort' | 'transactional' | 'undo'
	| 'textOnlyTransactional';

export const FailureHandlingKind = {

  /**
	 * Applying the workspace change is simply aborted if one of the changes
	 * provided fails. All operations executed before the failing operation
	 * stay executed.
	 */
  Abort: 'abort' as const,

  /**
	 * All operations are executed transactional. That means they either all
	 * succeed or no changes at all are applied to the workspace.
	 */
  Transactional: 'transactional' as const,


  /**
	 * If the workspace edit contains only textual file changes they are
	 * executed transactional. If resource changes (create, rename or delete
	 * file) are part of the change the failure handling strategy is abort.
	 */
  TextOnlyTransactional: 'textOnlyTransactional' as const,

  /**
	 * The client tries to undo the operations already executed. But there is no
	 * guarantee that this is succeeding.
	 */
  Undo: 'undo' as const,
} as const;
