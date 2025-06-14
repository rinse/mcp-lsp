import * as t from "io-ts";

import { LSPAny } from "./BaseTypes";
import { Range, RangeT } from "./Range";
import { TextDocumentPositionParams } from "./TextDocumentPositionParams";
import { WorkDoneProgressParams } from "./WorkDoneProgressParams";

/**
 * A symbol kind.
 */
export enum SymbolKind {
  File = 1,
  Module = 2,
  Namespace = 3,
  Package = 4,
  Class = 5,
  Method = 6,
  Property = 7,
  Field = 8,
  Constructor = 9,
  Enum = 10,
  Interface = 11,
  Function = 12,
  Variable = 13,
  Constant = 14,
  String = 15,
  Number = 16,
  Boolean = 17,
  Array = 18,
  Object = 19,
  Key = 20,
  Null = 21,
  EnumMember = 22,
  Struct = 23,
  Event = 24,
  Operator = 25,
  TypeParameter = 26,
}

export const SymbolKindT = t.union([t.literal(1), t.literal(2), t.literal(3), t.literal(4), t.literal(5), t.literal(6), t.literal(7), t.literal(8), t.literal(9), t.literal(10), t.literal(11), t.literal(12), t.literal(13), t.literal(14), t.literal(15), t.literal(16), t.literal(17), t.literal(18), t.literal(19), t.literal(20), t.literal(21), t.literal(22), t.literal(23), t.literal(24), t.literal(25), t.literal(26)]);

/**
 * Symbol tags are extra annotations that tweak the rendering of a symbol.
 */
export enum SymbolTag {
  /**
   * Render a symbol as obsolete, usually using a strike-out.
   */
  Deprecated = 1,
}

export const SymbolTagT = t.literal(1);

/**
 * The parameters of a `textDocument/prepareCallHierarchy` request.
 */
export interface CallHierarchyPrepareParams extends TextDocumentPositionParams, WorkDoneProgressParams {}

/**
 * Represents programming constructs like functions, methods, etc. in the context of call hierarchy.
 */
export interface CallHierarchyItem {
  /**
   * The name of this item.
   */
  name: string;

  /**
   * The kind of this item.
   */
  kind: SymbolKind;

  /**
   * Tags for this item.
   */
  tags?: SymbolTag[];

  /**
   * More detail for this item, e.g. the signature of a function.
   */
  detail?: string;

  /**
   * The resource identifier of this item.
   */
  uri: string;

  /**
   * The range enclosing this symbol not including leading/trailing whitespace
   * but everything else, e.g. comments and code.
   */
  range: Range;

  /**
   * The range that should be selected and revealed when this symbol is being
   * picked, e.g. the name of a function. Must be contained by the `range`.
   */
  selectionRange: Range;

  /**
   * A data entry field that is preserved between a call hierarchy prepare and
   * incoming calls or outgoing calls requests.
   */
  data?: LSPAny;
}

export const CallHierarchyItemT = t.type({
  name: t.string,
  kind: SymbolKindT,
  tags: t.union([t.array(SymbolTagT), t.undefined]),
  detail: t.union([t.string, t.undefined]),
  uri: t.string,
  range: RangeT,
  selectionRange: RangeT,
  data: t.union([t.any, t.undefined]),
});

/**
 * The parameter of a `callHierarchy/incomingCalls` request.
 */
export interface CallHierarchyIncomingCallsParams extends WorkDoneProgressParams {
  item: CallHierarchyItem;
}

/**
 * Represents an incoming call, e.g. a caller of a method or constructor.
 */
export interface CallHierarchyIncomingCall {
  /**
   * The item that makes the call.
   */
  from: CallHierarchyItem;

  /**
   * The ranges at which the calls appear. This is relative to the caller
   * denoted by `this.from`.
   */
  fromRanges: Range[];
}

export const CallHierarchyIncomingCallT = t.type({
  from: CallHierarchyItemT,
  fromRanges: t.array(RangeT),
});

/**
 * The parameter of a `callHierarchy/outgoingCalls` request.
 */
export interface CallHierarchyOutgoingCallsParams extends WorkDoneProgressParams {
  item: CallHierarchyItem;
}

/**
 * Represents an outgoing call, e.g. calling a getter from a method or a method from a constructor etc.
 */
export interface CallHierarchyOutgoingCall {
  /**
   * The item that is called.
   */
  to: CallHierarchyItem;

  /**
   * The range at which this item is called. This is the range relative to the caller,
   * e.g the item passed to `callHierarchy/outgoingCalls` request.
   */
  fromRanges: Range[];
}

export const CallHierarchyOutgoingCallT = t.type({
  to: CallHierarchyItemT,
  fromRanges: t.array(RangeT),
});

export const CallHierarchyItemArrayT = t.union([t.array(CallHierarchyItemT), t.null]);
export const CallHierarchyIncomingCallArrayT = t.union([t.array(CallHierarchyIncomingCallT), t.null]);
export const CallHierarchyOutgoingCallArrayT = t.union([t.array(CallHierarchyOutgoingCallT), t.null]);
