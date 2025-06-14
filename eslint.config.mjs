import eslintJs from "@eslint/js";
import eslintTs from "typescript-eslint";
import globals from "globals";
import parserTs from "@typescript-eslint/parser";
import pluginImport from "eslint-plugin-import";
import pluginStylistic from "@stylistic/eslint-plugin";

export default eslintTs.config(
  { ignores: ["**/node_modules/**", "out/**", "**/.git/**", ".wt/**"] },
  {
    files: ["**/*.ts"],
    plugins: {
      "@stylistic": pluginStylistic,
      "import": pluginImport,
    },
    extends: [
      eslintJs.configs.recommended,
      ...eslintTs.configs.recommendedTypeChecked,
      ...eslintTs.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      globals: globals.node,
      sourceType: "module",
      parser: parserTs,
      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true,
        },
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",
      "import/order": [
        "error", {
          "groups": [
            "builtin",
            "external",
            ["internal", "parent", "sibling"],
            "index",
            "type",
          ],
          "newlines-between": "always",
          "alphabetize": {
            "order": "asc",
            "caseInsensitive": true,
          },
          "warnOnUnassignedImports": true,
        },
      ],
      "@stylistic/eol-last": ["error", "always"],
      "@stylistic/comma-spacing": ["error", { "before": false, "after": true }],
      "@stylistic/comma-dangle": ["error", "always-multiline"],
      "@stylistic/indent": ["error", 2],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/max-statements-per-line": ["error", { "max": 1 }],
      "@stylistic/linebreak-style": ["error", "unix"],
      "@stylistic/no-trailing-spaces": ["error", {
        "skipBlankLines": false,
        "ignoreComments": false
      }],
      "@stylistic/object-curly-spacing": ["error", "always"],
      "@stylistic/array-bracket-spacing": ["error", "never"],
      "@stylistic/keyword-spacing": ["error", { "before": true, "after": true }],
      "@stylistic/space-before-blocks": ["error", "always"],
      "@stylistic/space-infix-ops": "error",
      "@stylistic/no-multiple-empty-lines": ["error", { "max": 1, "maxEOF": 0, "maxBOF": 0 }],
      "@stylistic/brace-style": ["error", "1tbs", { "allowSingleLine": true }],
      "@stylistic/function-call-spacing": ["error", "never"],
      "@stylistic/key-spacing": ["error", { "beforeColon": false, "afterColon": true }],
      "@stylistic/space-before-function-paren": ["error", {
        "anonymous": "always",
        "named": "never",
        "asyncArrow": "always"
      }],
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-var-requires": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/prefer-string-starts-ends-with": "error",
      "@typescript-eslint/prefer-includes": "error",
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always", { "null": "ignore" }],
      "curly": ["error", "all"],
      "no-else-return": "error",
      "no-duplicate-imports": "error",
      "no-throw-literal": "error",
      "prefer-template": "error",
    },
  }
);
