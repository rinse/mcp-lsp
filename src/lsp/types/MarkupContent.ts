import * as t from 'io-ts';

/**
 * Describes the content type that a client supports in various
 * result literals like `Hover`, `ParameterInfo` or `CompletionItem`.
 *
 * Please note that `MarkupKinds` must not start with a `$`. This kinds
 * are reserved for internal usage.
 */
export namespace MarkupKind {
  /**
	 * Plain text is supported as a content format
	 */
  export const PlainText: 'plaintext' = 'plaintext';

  /**
	 * Markdown is supported as a content format
	 */
  export const Markdown: 'markdown' = 'markdown';
}

export type MarkupKind = 'plaintext' | 'markdown';

/**
 * A `MarkupContent` literal represents a string value which content is
 * interpreted base on its kind flag. Currently the protocol supports
 * `plaintext` and `markdown` as markup kinds.
 *
 * If the kind is `markdown` then the value can contain fenced code blocks like
 * in GitHub issues.
 *
 * Here is an example how such a string can be constructed using
 * JavaScript / TypeScript:
 * ```typescript
 * let markdown: MarkdownContent = {
 * 	kind: MarkupKind.Markdown,
 * 	value: [
 * 		'# Header',
 * 		'Some text',
 * 		'```typescript',
 * 		'someCode();',
 * 		'```'
 * 	].join('\n')
 * };
 * ```
 *
 * *Please Note* that clients might sanitize the return markdown. A client could
 * decide to remove HTML from the markdown to avoid script execution.
 */
export interface MarkupContent {
  /**
	 * The type of the Markup
	 */
  kind: MarkupKind;

  /**
	 * The content itself
	 */
  value: string;
}

export const MarkupContentT = t.type({
  kind: t.union([t.literal(MarkupKind.Markdown), t.literal(MarkupKind.PlainText)]),
  value: t.string,
});

/**
 * Client capabilities specific to the used markdown parser.
 *
 * @since 3.16.0
 */
export interface MarkdownClientCapabilities {
  /**
	 * The name of the parser.
	 */
  parser: string;

  /**
	 * The version of the parser.
	 */
  version?: string;

  /**
	 * A list of HTML tags that the client allows / supports in
	 * Markdown.
	 *
	 * @since 3.17.0
	 */
  allowedTags?: string[];
}
