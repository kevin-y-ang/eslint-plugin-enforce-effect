import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-throw.js";

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

ruleTester.run("no-throw", rule, {
  valid: [
    {
      code: "return Effect.fail(error);",
    },
    {
      code: "const value = Effect.succeed(1);",
    },
  ],
  invalid: [
    {
      code: "throw new Error('boom');",
      errors: [{ messageId: "noThrow" }],
    },
    {
      code: "function fail(error: Error) { throw error; }",
      errors: [{ messageId: "noThrow" }],
    },
  ],
});
