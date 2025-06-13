import * as t from 'io-ts';

import { TextDocumentRegistrationOptions } from './Register';
import { TextDocumentPositionParams, TextDocumentPositionParamsT } from './TextDocumentPositionParams';
import { WorkDoneProgressOptions } from './WorkDoneProgressOptions';
import { WorkDoneProgressParams, WorkDoneProgressParamsT } from './WorkDoneProgressParams';

export interface RenameOptions extends WorkDoneProgressOptions {
  /**
	 * Renames should be checked and tested before being executed.
	 */
  prepareProvider?: boolean;
}

export interface RenameRegistrationOptions extends
  TextDocumentRegistrationOptions, RenameOptions {
}

export interface RenameParams extends TextDocumentPositionParams, WorkDoneProgressParams {
  /**
	 * The new name of the symbol. If the given name is not valid the
	 * request must return a [ResponseError](#ResponseError) with an
	 * appropriate message set.
	 */
  newName: string;
}

export const RenameParamsT = t.intersection([
  TextDocumentPositionParamsT,
  WorkDoneProgressParamsT,
  t.type({
    newName: t.string,
  }),
]);
