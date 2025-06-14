import * as t from "io-ts";

import { Location, LocationT } from "./Location";
import { TextDocumentRegistrationOptions } from "./Register";
import { TextDocumentPositionParams } from "./TextDocumentPositionParams";
import { WorkDoneProgressOptions } from "./WorkDoneProgressOptions";
import { WorkDoneProgressParams } from "./WorkDoneProgressParams";

/**
 * Client Capability:
 * - property name (optional): textDocument.typeDefinition
 * - property type: TypeDefinitionClientCapabilities defined as follows:
 */
export interface TypeDefinitionClientCapabilities {
  /**
   * Whether type definition supports dynamic registration.
   */
  dynamicRegistration?: boolean;

  /**
   * The client supports additional metadata in the form of definition links.
   */
  linkSupport?: boolean;
}

export type TypeDefinitionOptions = WorkDoneProgressOptions;

export interface TypeDefinitionRegistrationOptions
  extends TextDocumentRegistrationOptions, TypeDefinitionOptions {
}

export interface TypeDefinitionParams extends TextDocumentPositionParams, WorkDoneProgressParams {
}

/**
 * The result of a type definition request.
 */
export type TypeDefinition = Location | Location[] | null;

export const TypeDefinitionT = t.union([LocationT, t.array(LocationT), t.null]);