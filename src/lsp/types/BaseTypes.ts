import * as t from "io-ts";

/**
 * Defines an integer number in the range of -2^31 to 2^31 - 1.
 */
export const integer = t.number;
export type integer = t.TypeOf<typeof integer>;

/**
 * Defines an unsigned integer number in the range of 0 to 2^31 - 1.
 */
export const uinteger = t.number;
export type uinteger = t.TypeOf<typeof integer>;

/**
 * Defines a decimal number. Since decimal numbers are very
 * rare in the language server specification we denote the
 * exact range with every decimal using the mathematics
 * interval notation (e.g. [0, 1] denotes all decimals d with
 * 0 <= d <= 1.
 */
export const decimal = t.number;
export type decimal = t.TypeOf<typeof decimal>;

/**
 * The LSP any type
 *
 * @since 3.17.0
 */
export type LSPAny = LSPObject | LSPArray | string | integer | boolean | null;

export function isLSPAny(value: unknown): value is LSPAny {
  return (
    isLSPObject(value)
        || isLSPArray(value)
        || typeof value === 'string'
        || typeof value === 'number'
        || typeof value === 'boolean'
        || value === null
  );
}

/**
 * LSP object definition.
 *
 * @since 3.17.0
 */
export interface LSPObject { [key: string]: LSPAny }

export function isLSPObject(value: unknown): value is LSPObject {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value;
  return Object.values(obj).every(isLSPAny);
}

/**
 * LSP arrays.
 *
 * @since 3.17.0
 */
export type LSPArray = LSPAny[];

export function isLSPArray(value: unknown): value is LSPArray {
  if (!Array.isArray(value)) {
    return false;
  }
  const arr = value as unknown[];
  return arr.every(isLSPAny);
}
