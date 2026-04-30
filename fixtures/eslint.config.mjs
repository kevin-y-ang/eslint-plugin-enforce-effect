import { defineConfig } from "eslint/config";
import tsParser from "@typescript-eslint/parser";

import enforceEffect from "../dist/index.js";

export default defineConfig([
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        projectService: false,
      },
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
  ...enforceEffect.configs.recommended,
]);
