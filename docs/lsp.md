# LSP (Language Server Protocol) Documentation

This is a set of documentation of LSP.

Don't get all of contents on your context; this is quite large, it is adviced to create a task to read this documentation to have a research of LSP.

## Language Server Protocol Specification - 3.17

https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/

## Language Server Extension Guide

As you have seen in the Programmatic Language Features topic, it's possible to implement Language Features by directly using `languages.*` API. Language Server Extension, however, provides an alternative way of implementing such language support.

This topic:

- Explains the benefits of Language Server Extension.
- Walks you through building a Language Server using the Microsoft/vscode-languageserver-node library. You can also jump directly to the code in [lsp-sample](#lsp-example).

https://code.visualstudio.com/api/language-extensions/language-server-extension-guide

## LSP Example

Heavily documented sample code for [Language Server Extension Guide](#language-server-extension-guide)

https://github.com/Microsoft/vscode-extension-samples/tree/515a928615aaab84ae7f66a38e4346db84464fcb/lsp-sample

## Language Server Protocol の仕様及び実装方法

次のリンク集は、実用的なLSPの機能を紹介したものです。

- https://zenn.dev/mtshiba/books/language_server_protocol/viewer/03_basics
- https://zenn.dev/mtshiba/books/language_server_protocol/viewer/04_diagnostics
- https://zenn.dev/mtshiba/books/language_server_protocol/viewer/05_completion
- https://zenn.dev/mtshiba/books/language_server_protocol/viewer/06_inlay_hints
- https://zenn.dev/mtshiba/books/language_server_protocol/viewer/07_hover
- https://zenn.dev/mtshiba/books/language_server_protocol/viewer/08_goto_definition
- https://zenn.dev/mtshiba/books/language_server_protocol/viewer/09_find_references
- https://zenn.dev/mtshiba/books/language_server_protocol/viewer/10_rename
- https://zenn.dev/mtshiba/books/language_server_protocol/viewer/11_code_actions
- https://zenn.dev/mtshiba/books/language_server_protocol/viewer/12_code_lens
- https://zenn.dev/mtshiba/books/language_server_protocol/viewer/13_signature_help
- https://zenn.dev/mtshiba/books/language_server_protocol/viewer/14_execute_command
- https://zenn.dev/mtshiba/books/language_server_protocol/viewer/15_doc_symbol
- https://zenn.dev/mtshiba/books/language_server_protocol/viewer/16_ws_symbol
- https://zenn.dev/mtshiba/books/language_server_protocol/viewer/17_call_hierarchy
- https://zenn.dev/mtshiba/books/language_server_protocol/viewer/18_folding_range
- https://zenn.dev/mtshiba/books/language_server_protocol/viewer/19_semantic_tokens
- https://zenn.dev/mtshiba/books/language_server_protocol/viewer/20_configuration
- https://zenn.dev/mtshiba/books/language_server_protocol/viewer/22_appendix2

## JSON-RPC 2.0 Specification

LSPはJSON-RPC 2.0を使って実装されます。
仮にJSON-RPCについての疑問がある場合、こちらを参照してください。

https://www.jsonrpc.org/specification
