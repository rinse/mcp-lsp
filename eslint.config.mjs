import eslintJs from "@eslint/js";
import eslintTs from "typescript-eslint";
import globals from "globals";
import parserTs from "@typescript-eslint/parser";
import pluginImport from "eslint-plugin-import";
import pluginStylistic from "@stylistic/eslint-plugin";

export default eslintTs.config(
  { ignores: ["**/node_modules/**", "out/**", "**/.git/**", ".wt/**", ".tmp/**"] },
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
      "@stylistic/eol-last": ["error"],
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
      "@typescript-eslint/explicit-function-return-type": ["error", { allowHigherOrderFunctions: true }],
      "@typescript-eslint/method-signature-style": ["error", "method"],
    },
  }
);
