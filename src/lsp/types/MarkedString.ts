import * as t from "io-ts";

/**
 * MarkedString can be used to render human readable text. It is either a
 * markdown string or a code-block that provides a language and a code snippet.
 * The language identifier is semantically equal to the optional language
 * identifier in fenced code blocks in GitHub issues.
 *
 * The pair of a language and a value is an equivalent to markdown:
 * ```${language}
 * ${value}
 * ```
 *
 * Note that markdown strings will be sanitized - that means html will be
 * escaped.
 *
 * @deprecated use MarkupContent instead.
 */
export type MarkedString = string | { language: string; value: string };

export const MarkedStringT = t.union([
    t.string,
    t.type({
        language: t.string,
        value: t.string
    }),
])

export function markedStringToJsonString(markedString: MarkedString): string {
    return typeof markedString === "string"
        ? markedString
        : JSON.stringify(markedString);
}
