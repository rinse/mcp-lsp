import * as t from "io-ts";

import { MarkedString, MarkedStringT } from "./MarkedString";
import { MarkupContent, MarkupContentT, MarkupKind } from "./MarkupContent";
import { Range, RangeT } from "./Range";
import { TextDocumentRegistrationOptions } from "./Register";
import { TextDocumentPositionParams } from "./TextDocumentPositionParams";
import { WorkDoneProgressOptions } from "./WorkDoneProgressOptions";
import { WorkDoneProgressParams } from "./WorkDoneProgressParams";

/**
 * Client Capability:
 * - property name (optional): textDocument.hover
 * - property type: HoverClientCapabilities defined as follows:
 */
export interface HoverClientCapabilities {
  /**
	 * Whether hover supports dynamic registration.
	 */
  dynamicRegistration?: boolean;

  /**
	 * Client supports the follow content formats if the content
	 * property refers to a `literal of type MarkupContent`.
	 * The order describes the preferred format of the client.
	 */
  contentFormat?: MarkupKind[];
}

export interface HoverOptions extends WorkDoneProgressOptions {
}

export interface HoverRegistrationOptions
  extends TextDocumentRegistrationOptions, HoverOptions {
}

export interface HoverParams extends TextDocumentPositionParams, WorkDoneProgressParams {
}

/**
 * The result of a hover request.
 */
export interface Hover {
  /**
	 * The hover's content
	 */
  contents: MarkedString | MarkedString[] | MarkupContent;

  /**
	 * An optional range is a range inside a text document
	 * that is used to visualize a hover, e.g. by changing the background color.
	 */
  range?: Range;
}

export const HoverT = t.type({
  contents: t.union([MarkedStringT, t.array(MarkedStringT), MarkupContentT]),
  range: t.union([RangeT, t.undefined]),
});
