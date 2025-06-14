import * as t from "io-ts";

import { Location, LocationT } from "./Location";
import { TextDocumentRegistrationOptions } from "./Register";
import { TextDocumentPositionParams } from "./TextDocumentPositionParams";
import { WorkDoneProgressOptions } from "./WorkDoneProgressOptions";
import { WorkDoneProgressParams } from "./WorkDoneProgressParams";

/**
 * Client Capability:
 * - property name (optional): textDocument.implementation
 * - property type: ImplementationClientCapabilities defined as follows:
 */
export interface ImplementationClientCapabilities {
  /**
   * Whether implementation supports dynamic registration.
   */
  dynamicRegistration?: boolean;

  /**
   * The client supports additional metadata in the form of implementation links.
   */
  linkSupport?: boolean;
}

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