import * as t from "io-ts";

import { Location, LocationT } from "./Location";
import { TextDocumentRegistrationOptions } from "./Register";
import { TextDocumentPositionParams } from "./TextDocumentPositionParams";
import { WorkDoneProgressOptions } from "./WorkDoneProgressOptions";
import { WorkDoneProgressParams } from "./WorkDoneProgressParams";

export type ImplementationOptions = WorkDoneProgressOptions;

export interface ImplementationRegistrationOptions
  extends TextDocumentRegistrationOptions, ImplementationOptions {
}

export interface ImplementationParams extends TextDocumentPositionParams, WorkDoneProgressParams {
}

/**
 * The result of an implementation request.
 */
export type Implementation = Location | Location[] | null;

export const ImplementationT = t.union([LocationT, t.array(LocationT), t.null]);