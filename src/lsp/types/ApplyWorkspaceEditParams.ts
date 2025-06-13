import * as t from 'io-ts';

import { uinteger } from './BaseTypes';
import { WorkspaceEdit, WorkspaceEditT } from './WorkspaceEdit';

export interface ApplyWorkspaceEditParams {
  /**
	 * An optional label of the workspace edit. This label is
	 * presented in the user interface for example on an undo
	 * stack to undo the workspace edit.
	 */
  label?: string;

  /**
	 * The edits to apply.
	 */
  edit: WorkspaceEdit;
}

export const ApplyWorkspaceEditParamsT = t.intersection([
  t.type({
    edit: WorkspaceEditT,
  }),
  t.partial({
    label: t.union([t.string, t.undefined]),
  }),
]);

export interface ApplyWorkspaceEditResult {
  /**
	 * Indicates whether the edit was applied or not.
	 */
  applied: boolean;

  /**
	 * An optional textual description for why the edit was not applied.
	 * This may be used by the server for diagnostic logging or to provide
	 * a suitable error for a request that triggered the edit.
	 */
  failureReason?: string;

  /**
	 * Depending on the client's failure handling strategy `failedChange`
	 * might contain the index of the change that failed. This property is
	 * only available if the client signals a `failureHandling` strategy
	 * in its client capabilities.
	 */
  failedChange?: uinteger;
}

export const ApplyWorkspaceEditResultT = t.intersection([
  t.type({
    applied: t.boolean,
  }),
  t.partial({
    failureReason: t.string,
    failedChange: uinteger,
  }),
]);
