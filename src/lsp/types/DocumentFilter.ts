export interface DocumentFilter {
  /**
	 * A language id, like `typescript`.
	 */
  language?: string;

  /**
	 * A Uri scheme, like `file` or `untitled`.
	 */
  scheme?: string;

  /**
	 * A glob pattern, like "*.{ts,js}".
	 */
  pattern?: string;
}

export type DocumentSelector = DocumentFilter[];
