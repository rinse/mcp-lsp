import * as t from "io-ts";

import { Location, LocationT } from "./Location";
import { TextDocumentRegistrationOptions } from "./Register";
import { TextDocumentPositionParams, TextDocumentPositionParamsT } from "./TextDocumentPositionParams";
import { WorkDoneProgressOptions } from "./WorkDoneProgressOptions";
import { WorkDoneProgressParams, WorkDoneProgressParamsT } from "./WorkDoneProgressParams";

/**
 * Client Capability:
 * - property name (optional): textDocument.references
 * - property type: ReferenceClientCapabilities defined as follows:
 */
export interface ReferenceClientCapabilities {
  /**
   * Whether references supports dynamic registration.
   */
  dynamicRegistration?: boolean;
}

export type ReferenceOptions = WorkDoneProgressOptions;

export interface ReferenceRegistrationOptions
  extends TextDocumentRegistrationOptions, ReferenceOptions {
}

export interface ReferenceContext {
  /**
   * Include the declaration of the current symbol.
   */
  includeDeclaration: boolean;
}

export const ReferenceContextT = t.type({
  includeDeclaration: t.boolean,
});

export interface ReferenceParams extends TextDocumentPositionParams, WorkDoneProgressParams {
  context: ReferenceContext;
}

export const ReferenceParamsT = t.intersection([
  TextDocumentPositionParamsT,
  WorkDoneProgressParamsT,
  t.type({
    context: ReferenceContextT,
  }),
]);

/**
 * The result of a references request.
 */
export type References = Location[] | null;

export const ReferencesT = t.union([t.array(LocationT), t.null]);