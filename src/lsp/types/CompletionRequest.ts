import * as t from "io-ts";

import { PartialResultParams, PartialResultParamsT } from "./PartialResultParams";
import { TextDocumentPositionParams, TextDocumentPositionParamsT } from "./TextDocumentPositionParams";
import { WorkDoneProgressParams, WorkDoneProgressParamsT } from "./WorkDoneProgressParams";

/**
 * How a completion was triggered
 */
export enum CompletionTriggerKind {
  /**
   * Completion was triggered by typing an identifier (24x7 code
   * complete), manual invocation (e.g Ctrl+Space) or via API.
   */
  Invoked = 1,

  /**
   * Completion was triggered by a trigger character specified by
   * the `triggerCharacters` properties of the `CompletionRegistrationOptions`.
   */
  TriggerCharacter = 2,

  /**
   * Completion was re-triggered as current completion is incomplete
   */
  TriggerForIncompleteCompletions = 3,
}

export const CompletionTriggerKindT = t.union([
  t.literal(1),
  t.literal(2),
  t.literal(3),
]);

/**
 * Additional details for a completion request.
 */
export interface CompletionContext {
  /**
   * How the completion was triggered.
   */
  triggerKind: CompletionTriggerKind;

  /**
   * The trigger character (a single character) that has trigger code complete.
   * Is undefined if `triggerKind !== CompletionTriggerKind.TriggerCharacter`
   */
  triggerCharacter?: string;
}

export const CompletionContextT = t.intersection([
  t.type({
    triggerKind: CompletionTriggerKindT,
  }),
  t.partial({
    triggerCharacter: t.string,
  }),
]);

export interface CompletionParams
  extends TextDocumentPositionParams,
  WorkDoneProgressParams,
  PartialResultParams {
  /**
   * The completion context. This is only available it the client specifies
   * to send this using `ClientCapabilities.textDocument.completion.contextSupport === true`
   */
  context?: CompletionContext;
}

export const CompletionParamsT = t.intersection([
  TextDocumentPositionParamsT,
  WorkDoneProgressParamsT,
  PartialResultParamsT,
  t.partial({
    context: CompletionContextT,
  }),
]);

/**
 * The kind of a completion entry.
 */
export enum CompletionItemKind {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Unit = 11,
  Value = 12,
  Enum = 13,
  Keyword = 14,
  Snippet = 15,
  Color = 16,
  File = 17,
  Reference = 18,
  Folder = 19,
  EnumMember = 20,
  Constant = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25,
}

export const CompletionItemKindT = t.union([
  t.literal(1), t.literal(2), t.literal(3), t.literal(4), t.literal(5),
  t.literal(6), t.literal(7), t.literal(8), t.literal(9), t.literal(10),
  t.literal(11), t.literal(12), t.literal(13), t.literal(14), t.literal(15),
  t.literal(16), t.literal(17), t.literal(18), t.literal(19), t.literal(20),
  t.literal(21), t.literal(22), t.literal(23), t.literal(24), t.literal(25),
]);

/**
 * Defines whether the insert text in a completion item should be interpreted as
 * plain text or a snippet.
 */
export enum InsertTextFormat {
  /**
   * The primary text to be inserted is treated as a plain string.
   */
  PlainText = 1,

  /**
   * The primary text to be inserted is treated as a snippet.
   */
  Snippet = 2,
}

export const InsertTextFormatT = t.union([
  t.literal(1),
  t.literal(2),
]);

/**
 * A completion item represents a text snippet that is
 * proposed to complete text that is being typed.
 */
export interface CompletionItem {
  /**
   * The label of this completion item. By default
   * also the text that is inserted when selecting
   * this completion.
   */
  label: string;

  /**
   * The kind of this completion item. Based of the kind
   * an icon is chosen by the editor.
   */
  kind?: CompletionItemKind;

  /**
   * A human-readable string with additional information
   * about this item, like type or symbol information.
   */
  detail?: string;

  /**
   * A human-readable string that represents a doc-comment.
   */
  documentation?: string;

  /**
   * Indicates if this item is deprecated.
   */
  deprecated?: boolean;

  /**
   * Select this item when showing.
   */
  preselect?: boolean;

  /**
   * A string that should be used when comparing this item
   * with other items. When `falsy` the label is used.
   */
  sortText?: string;

  /**
   * A string that should be used when filtering a set of
   * completion items. When `falsy` the label is used.
   */
  filterText?: string;

  /**
   * A string that should be inserted into a document when selecting
   * this completion. When `falsy` the label is used.
   */
  insertText?: string;

  /**
   * The format of the insert text. The format applies to both the `insertText` property
   * and the `newText` property of a provided `textEdit`. If omitted defaults to
   * `InsertTextFormat.PlainText`.
   */
  insertTextFormat?: InsertTextFormat;
}

export const CompletionItemT = t.intersection([
  t.type({
    label: t.string,
  }),
  t.partial({
    kind: CompletionItemKindT,
    detail: t.string,
    documentation: t.string,
    deprecated: t.boolean,
    preselect: t.boolean,
    sortText: t.string,
    filterText: t.string,
    insertText: t.string,
    insertTextFormat: InsertTextFormatT,
  }),
]);

/**
 * Represents a collection of [completion items](#CompletionItem) to be presented
 * in the editor.
 */
export interface CompletionList {
  /**
   * This list it not complete. Further typing should result in recomputing
   * this list.
   */
  isIncomplete: boolean;

  /**
   * The completion items.
   */
  items: CompletionItem[];
}

export const CompletionListT = t.type({
  isIncomplete: t.boolean,
  items: t.array(CompletionItemT),
});

/**
 * The result of a completion request.
 */
export type CompletionResult = CompletionItem[] | CompletionList | null;

export const CompletionResultT = t.union([
  t.array(CompletionItemT),
  CompletionListT,
  t.null,
]);
