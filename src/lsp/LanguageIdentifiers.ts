// https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocumentItem
export const ABAP = 'abap';
export const BAT = 'bat';
export const BIBTEX = 'bibtex';
export const CLOJURE = 'clojure';
export const COFFEESCRIPT = 'coffeescript';
export const C = 'c';
export const CPP = 'cpp';
export const CSHARP = 'csharp';
export const CSS = 'css';
export const DIFF = 'diff';
export const DART = 'dart';
export const DOCKERFILE = 'dockerfile';
export const ELIXIR = 'elixir';
export const ERLANG = 'erlang';
export const FSHARP = 'fsharp';
export const GIT_COMMIT = 'git-commit';
export const GIT_REBASE = 'git-rebase';
export const GO = 'go';
export const GROOVY = 'groovy';
export const HANDLEBARS = 'handlebars';
export const HTML = 'html';
export const INI = 'ini';
export const JAVA = 'java';
export const JAVASCRIPT = 'javascript';
export const JAVASCRIPT_REACT = 'javascriptreact';
export const JSON = 'json';
export const LATEX = 'latex';
export const LESS = 'less';
export const LUA = 'lua';
export const MAKEFILE = 'makefile';
export const MARKDOWN = 'markdown';
export const OBJECTIVE_C = 'objective-c';
export const OBJECTIVE_CPP = 'objective-cpp';
export const PERL = 'perl';
export const PERL6 = 'perl6';
export const PHP = 'php';
export const POWERSHELL = 'powershell';
export const PUG = 'jade';
export const PYTHON = 'python';
export const R = 'r';
export const RAZOR = 'razor';
export const RUBY = 'ruby';
export const RUST = 'rust';
export const SCSS = 'scss';
export const SASS = 'sass';
export const SCALA = 'scala';
export const SHADERLAB = 'shaderlab';
export const SHELLSCRIPT = 'shellscript';
export const SQL = 'sql';
export const SWIFT = 'swift';
export const TYPESCRIPT = 'typescript';
export const TYPESCRIPT_REACT = 'typescriptreact';
export const TEX = 'tex';
export const VB = 'vb';
export const XML = 'xml';
export const XSL = 'xsl';
export const YAML = 'yaml';

export function mapExtensionToLanguageId(extension: string): string {
  switch (extension.toLowerCase()) {
    case '.abap':
      return ABAP;
    case '.bat':
    case '.cmd':
      return BAT;
    case '.bib':
      return BIBTEX;
    case '.clj':
    case '.cljs':
    case '.cljc':
      return CLOJURE;
    case '.coffee':
      return COFFEESCRIPT;
    case '.c':
    case '.h':
      return C;
    case '.cpp':
    case '.cxx':
    case '.cc':
    case '.c++':
    case '.hpp':
    case '.hxx':
    case '.hh':
      return CPP;
    case '.cs':
      return CSHARP;
    case '.css':
      return CSS;
    case '.diff':
    case '.patch':
      return DIFF;
    case '.dart':
      return DART;
    case '.dockerfile':
      return DOCKERFILE;
    case '.ex':
    case '.exs':
      return ELIXIR;
    case '.erl':
    case '.hrl':
      return ERLANG;
    case '.fs':
    case '.fsi':
    case '.fsx':
      return FSHARP;
    case '.go':
      return GO;
    case '.groovy':
    case '.gvy':
      return GROOVY;
    case '.hbs':
    case '.handlebars':
      return HANDLEBARS;
    case '.html':
    case '.htm':
      return HTML;
    case '.ini':
    case '.cfg':
      return INI;
    case '.java':
      return JAVA;
    case '.js':
    case '.mjs':
      return JAVASCRIPT;
    case '.jsx':
      return JAVASCRIPT_REACT;
    case '.json':
    case '.jsonc':
      return JSON;
    case '.tex':
    case '.latex':
      return LATEX;
    case '.less':
      return LESS;
    case '.lua':
      return LUA;
    case '.makefile':
    case '.mk':
      return MAKEFILE;
    case '.md':
    case '.markdown':
      return MARKDOWN;
    case '.m':
      return OBJECTIVE_C;
    case '.mm':
      return OBJECTIVE_CPP;
    case '.pl':
    case '.pm':
      return PERL;
    case '.p6':
    case '.pl6':
    case '.pm6':
      return PERL6;
    case '.php':
    case '.phtml':
      return PHP;
    case '.ps1':
    case '.psm1':
    case '.psd1':
      return POWERSHELL;
    case '.jade':
    case '.pug':
      return PUG;
    case '.py':
    case '.pyw':
      return PYTHON;
    case '.r':
    case '.R':
      return R;
    case '.cshtml':
      return RAZOR;
    case '.rb':
      return RUBY;
    case '.rs':
      return RUST;
    case '.scss':
      return SCSS;
    case '.sass':
      return SASS;
    case '.scala':
      return SCALA;
    case '.shader':
    case '.cginc':
      return SHADERLAB;
    case '.sh':
    case '.bash':
    case '.zsh':
      return SHELLSCRIPT;
    case '.sql':
      return SQL;
    case '.swift':
      return SWIFT;
    case '.ts':
      return TYPESCRIPT;
    case '.tsx':
      return TYPESCRIPT_REACT;
    case '.vb':
    case '.vbs':
      return VB;
    case '.xml':
      return XML;
    case '.xsl':
    case '.xslt':
      return XSL;
    case '.yaml':
    case '.yml':
      return YAML;
    default:
      return TYPESCRIPT;
  }
}

export function getLanguageIdentifier(filePath: string): string {
  const lastDotIndex = filePath.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return TYPESCRIPT;
  }
  const extension = filePath.substring(lastDotIndex);
  return mapExtensionToLanguageId(extension);
}
