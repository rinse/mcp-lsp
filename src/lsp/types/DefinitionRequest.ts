import * as t from "io-ts";

import { Location, LocationT } from "./Location";
import { TextDocumentRegistrationOptions } from "./Register";
import { TextDocumentPositionParams } from "./TextDocumentPositionParams";
import { WorkDoneProgressOptions } from "./WorkDoneProgressOptions";
import { WorkDoneProgressParams } from "./WorkDoneProgressParams";

/**
 * Client Capability:
 * - property name (optional): textDocument.definition
 * - property type: DefinitionClientCapabilities defined as follows:
 */
export interface DefinitionClientCapabilities {
  /**
   * Whether definition supports dynamic registration.
   */
  dynamicRegistration?: boolean;

  /**
   * The client supports additional metadata in the form of definition links.
   */
  linkSupport?: boolean;
}

export type DefinitionOptions = WorkDoneProgressOptions;

export interface DefinitionRegistrationOptions
  extends TextDocumentRegistrationOptions, DefinitionOptions {
}

export interface DefinitionParams extends TextDocumentPositionParams, WorkDoneProgressParams {
}

/**
 * The result of a definition request.
 */
export type Definition = Location | Location[] | null;

export const DefinitionT = t.union([LocationT, t.array(LocationT), t.null]);
