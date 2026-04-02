import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-undefined.js";

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

ruleTester.run("no-undefined", rule, {
  valid: [
    {
      code: "const value = Option.none();",
    },
    {
      code: "const record = { undefined: 1 };",
    },
    {
      code: "const value = record.undefined;",
    },
  ],
  invalid: [
    {
      code: "const value = undefined;",
      errors: [{ messageId: "noUndefined" }],
    },
    {
      code: "type MaybeValue = string | undefined;",
      errors: [{ messageId: "noUndefined" }],
    },
    {
      code: "function missing(undefined: string) { return undefined; }",
      errors: [
        { messageId: "noUndefined" },
        { messageId: "noUndefined" },
      ],
    },
    {
      code: "const value = { undefined };",
      errors: [{ messageId: "noUndefined" }],
    },
  ],
});
