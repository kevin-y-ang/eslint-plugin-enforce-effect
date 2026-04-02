import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-null.js";

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

ruleTester.run("no-null", rule, {
  valid: [
    {
      code: "const value = Option.none();",
    },
    {
      code: "type MaybeValue = string | undefined;",
    },
  ],
  invalid: [
    {
      code: "const value = null;",
      errors: [{ messageId: "noNull" }],
    },
    {
      code: "type MaybeValue = string | null;",
      errors: [{ messageId: "noNull" }],
    },
  ],
});
