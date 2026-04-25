import { defineConfig } from "eslint/config";
import tsParser from "@typescript-eslint/parser";

import enforceEffect from "../dist/index.js";

const scopedTocatenarycloudFixtures = (configs) =>
  configs.map((config) => ({
    ...config,
    files: ["**/catenarycloud/**/*.ts"],
  }));

const scopedToAccountabilityFixtures = (configs) =>
  configs.map((config) => ({
    ...config,
    files: ["**/accountability/**/*.ts"],
  }));

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
  ...scopedTocatenarycloudFixtures(
    enforceEffect.configs["catenarycloud-full"],
  ),
  ...scopedTocatenarycloudFixtures(enforceEffect.configs["catenarycloud-web"]),
  ...scopedTocatenarycloudFixtures(
    enforceEffect.configs["catenarycloud-ts-type"],
  ),
  ...scopedToAccountabilityFixtures(enforceEffect.configs.accountability),
]);
