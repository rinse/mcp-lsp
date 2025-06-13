import * as t from 'io-ts';

import { Range, RangeT } from "./Range";

export interface TextEdit {
  /**
	 * The range of the text document to be manipulated. To insert
	 * text into a document create a range where start === end.
	 */
  range: Range;

  /**
	 * The string to be inserted. For delete operations use an
	 * empty string.
	 */
  newText: string;
}

export const TextEditT = t.type({
  range: RangeT,
  newText: t.string,
});

/**
 * Additional information that describes document changes.
 *
 * @since 3.16.0
 */
export interface ChangeAnnotation {
  /**
	 * A human-readable string describing the actual change. The string
	 * is rendered prominent in the user interface.
	 */
  label: string;

  /**
	 * A flag which indicates that user confirmation is needed
	 * before applying the change.
	 */
  needsConfirmation?: boolean;

  /**
	 * A human-readable string which is rendered less prominent in
	 * the user interface.
	 */
  description?: string;
}

export const ChangeAnnotationT = t.type({
  label: t.string,
  needsConfirmation: t.union([t.boolean, t.undefined]),
  description: t.union([t.string, t.undefined]),
});

/**
 * An identifier referring to a change annotation managed by a workspace
 * edit.
 *
 * @since 3.16.0.
 */
export type ChangeAnnotationIdentifier = string;

/**
 * A special text edit with an additional change annotation.
 *
 * @since 3.16.0.
 */
export interface AnnotatedTextEdit extends TextEdit {
  /**
	 * The actual annotation identifier.
	 */
  annotationId: ChangeAnnotationIdentifier;
}
