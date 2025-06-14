import * as t from "io-ts";

import { LSPObject } from "./BaseTypes";
import { Range, RangeT } from "./Range";
import { TextDocumentIdentifier, TextDocumentIdentifierT } from "./TextDocumentIdentifier";
import { WorkDoneProgressParams } from "./WorkDoneProgressParams";
import { WorkspaceEdit, WorkspaceEditT } from "./WorkspaceEdit";

/**
 * Describes the severity of a diagnostic.
 */
export enum DiagnosticSeverity {
  /**
   * Reports an error.
   */
  Error = 1,
  /**
   * Reports a warning.
   */
  Warning = 2,
  /**
   * Reports an information.
   */
  Information = 3,
  /**
   * Reports a hint.
   */
  Hint = 4,
}

/**
 * The diagnostic tags.
 */
export enum DiagnosticTag {
  /**
   * Unused or unnecessary code.
   */
  Unnecessary = 1,
  /**
   * Deprecated or obsolete code.
   */
  Deprecated = 2,
}

export interface Diagnostic {
  /**
   * The range at which the message applies.
   */
  range: Range;

  /**
   * The diagnostic's severity. Can be omitted. If omitted it is up to the
   * client to interpret diagnostics as error, warning, info or hint.
   */
  severity?: DiagnosticSeverity;

  /**
   * The diagnostic's code, which might appear in the user interface.
   */
  code?: number | string;

  /**
   * An optional property to describe the error code.
   */
  codeDescription?: {
    /**
     * An URI to open with more information about the diagnostic error.
     */
    href: string;
  };

  /**
   * A human-readable string describing the source of this
   * diagnostic, e.g. 'typescript' or 'super lint'.
   */
  source?: string;

  /**
   * The diagnostic's message.
   */
  message: string;

  /**
   * Additional metadata about the diagnostic.
   */
  tags?: DiagnosticTag[];

  /**
   * An array of related diagnostic information, e.g. when symbol-names within
   * a scope collide all definitions can be marked with this property.
   */
  relatedInformation?: DiagnosticRelatedInformation[];

  /**
   * A data entry field that is preserved between a `textDocument/publishDiagnostics`
   * notification and `textDocument/codeAction` request.
   */
  data?: LSPObject;
}

export const DiagnosticT = t.intersection([
  t.type({
    range: RangeT,
    message: t.string,
  }),
  t.partial({
    severity: t.number,
    code: t.union([t.number, t.string]),
    codeDescription: t.type({
      href: t.string,
    }),
    source: t.string,
    tags: t.array(t.number),
    relatedInformation: t.array(
      t.type({
        location: t.type({
          uri: t.string,
          range: RangeT,
        }),
        message: t.string,
      }),
    ),
    data: t.object,
  }),
]);

export interface DiagnosticRelatedInformation {
  /**
   * The location of this related diagnostic information.
   */
  location: {
    uri: string;
    range: Range;
  };

  /**
   * The message of this related diagnostic information.
   */
  message: string;
}

/**
 * A set of predefined code action kinds
 */
export const CodeActionKind = {
  /**
   * Base kind for quickfix actions: 'quickfix'
   */
  QuickFix: 'quickfix' as const,

  /**
   * Base kind for refactoring actions: 'refactor'
   */
  Refactor: 'refactor' as const,

  /**
   * Base kind for refactoring extraction actions: 'refactor.extract'
   */
  RefactorExtract: 'refactor.extract' as const,

  /**
   * Base kind for refactoring inline actions: 'refactor.inline'
   */
  RefactorInline: 'refactor.inline' as const,

  /**
   * Base kind for refactoring rewrite actions: 'refactor.rewrite'
   */
  RefactorRewrite: 'refactor.rewrite' as const,

  /**
   * Base kind for source actions: 'source'
   */
  Source: 'source' as const,

  /**
   * Base kind for an organize imports source action: 'source.organizeImports'
   */
  SourceOrganizeImports: 'source.organizeImports' as const,

  /**
   * Base kind for auto-fix source actions: 'source.fixAll'
   */
  SourceFixAll: 'source.fixAll' as const,
} as const;

export type CodeActionKind = typeof CodeActionKind[keyof typeof CodeActionKind];

export interface Command {
  /**
   * Title of the command, like `save`.
   */
  title: string;

  /**
   * The identifier of the actual command handler.
   */
  command: string;

  /**
   * Arguments that the command handler should be invoked with.
   */
  arguments?: LSPObject[];
}

export const CommandT = t.intersection([
  t.type({
    title: t.string,
    command: t.string,
  }),
  t.partial({
    arguments: t.array(t.object),
  }),
]);

export interface CodeAction {
  /**
   * A short, human-readable, title for this code action.
   */
  title: string;

  /**
   * The kind of the code action.
   *
   * Used to filter code actions.
   */
  kind?: CodeActionKind;

  /**
   * The diagnostics that this code action resolves.
   */
  diagnostics?: Diagnostic[];

  /**
   * Marks this as a preferred action. Preferred actions are used by the
   * `auto fix` command and can be targeted by keybindings.
   *
   * A quick fix should be marked preferred if it properly addresses the
   * underlying error. A refactoring should be marked preferred if it is the
   * most reasonable choice of actions to take.
   */
  isPreferred?: boolean;

  /**
   * Marks that the code action cannot currently be applied.
   *
   * Clients should follow the following guidelines regarding disabled code
   * actions:
   *   - Disabled code actions are not shown in automatic lightbulbs
   *     code action menus.
   *   - Disabled actions are shown as faded out in the code action menu
   *     when the user requests a more specific type of code action, such as
   *     refactorings.
   *   - If the user has a keybinding that auto applies a code action and
   *     only disabled code actions are returned, the client should show the
   *     user an error message with `reason` in the editor.
   */
  disabled?: {
    /**
     * Human readable description of why the code action is currently
     * disabled.
     *
     * This is displayed in the user interface.
     */
    reason: string;
  };

  /**
   * The workspace edit this code action performs.
   */
  edit?: WorkspaceEdit;

  /**
   * A command this code action executes. If a code action
   * provides an edit and a command, first the edit is
   * executed and then the command.
   */
  command?: Command;

  /**
   * A data entry field that is preserved on a code action between
   * a `textDocument/codeAction` and a `codeAction/resolve` request.
   */
  data?: LSPObject;
}

export const CodeActionT = t.intersection([
  t.type({
    title: t.string,
  }),
  t.partial({
    kind: t.string,
    diagnostics: t.array(DiagnosticT),
    isPreferred: t.boolean,
    disabled: t.type({
      reason: t.string,
    }),
    edit: WorkspaceEditT,
    command: CommandT,
    data: t.object,
  }),
]);

export interface CodeActionContext {
  /**
   * An array of diagnostics known on the client side overlapping the range
   * provided to the `textDocument/codeAction` request. They are provided so
   * that the server knows which errors are currently presented to the user
   * for the given range. There is no guarantee that these accurately reflect
   * the error state of the resource. The primary parameter
   * to compute code actions is the provided range.
   */
  diagnostics: Diagnostic[];

  /**
   * Requested kinds of actions to return.
   *
   * Actions not of this kind are filtered out by the client before being
   * shown. So servers can omit computing them.
   */
  only?: CodeActionKind[];

  /**
   * The reason why code actions were requested.
   *
   * @since 3.17.0
   */
  triggerKind?: CodeActionTriggerKind;
}

export const CodeActionContextT = t.intersection([
  t.type({
    diagnostics: t.array(DiagnosticT),
  }),
  t.partial({
    only: t.array(t.string),
    triggerKind: t.number,
  }),
]);

/**
 * The reason why code actions were requested.
 */
export enum CodeActionTriggerKind {
  /**
   * Code actions were explicitly requested by the user or by an extension.
   */
  Invoked = 1,

  /**
   * Code actions were requested automatically.
   *
   * This typically happens when current selection in a file changes, but can
   * also be triggered when file content changes.
   */
  Automatic = 2,
}

export interface CodeActionParams extends WorkDoneProgressParams {
  /**
   * The document in which the command was invoked.
   */
  textDocument: TextDocumentIdentifier;

  /**
   * The range for which the command was invoked.
   */
  range: Range;

  /**
   * Context carrying additional information.
   */
  context: CodeActionContext;
}

export const CodeActionParamsT = t.intersection([
  t.type({
    textDocument: TextDocumentIdentifierT,
    range: RangeT,
    context: CodeActionContextT,
  }),
  t.partial({
    workDoneToken: t.union([t.string, t.number]),
  }),
]);

export type CodeActionResult = (CodeAction | Command)[] | null;

export const CodeActionResultT = t.union([
  t.array(t.union([CodeActionT, CommandT])),
  t.null,
]);
