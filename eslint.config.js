// @ts-check

import js from "@eslint/js";
import { defineConfig } from 'eslint/config';
import eslintPlugin from 'eslint-plugin-eslint-plugin';
import tseslint from 'typescript-eslint';
import tsParser from "@typescript-eslint/parser";

export default defineConfig(
  js.configs.recommended,
  tseslint.configs.recommended,
  eslintPlugin.configs.recommended,
  {
    ignores: ["dist", "coverage", "node_modules", "fixtures"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      "no-undef": "off",
    },
  },
)
