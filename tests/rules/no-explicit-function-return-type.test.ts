import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-explicit-function-return-type.js";


RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.itSkip = it.skip;

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
});

ruleTester.run("no-explicit-function-return-type", rule, {
  valid: [
    {
      code: "function readValue(input: string) { return input.trim(); }",
    },
    {
      code: "const readValue = (input: string) => input.trim();",
    },
    {
      code: "const service = { readValue(input: string) { return input.trim(); } };",
    },
  ],
  invalid: [
    {
      code: "function readValue(input: string): string { return input.trim(); }",
      errors: [{ messageId: "noExplicitFunctionReturnType" }],
    },
    {
      code: "const readValue = (input: string): string => input.trim();",
      errors: [{ messageId: "noExplicitFunctionReturnType" }],
    },
    {
      code: "const service = { readValue(input: string): string { return input.trim(); } };",
      errors: [{ messageId: "noExplicitFunctionReturnType" }],
    },
  ],
});
