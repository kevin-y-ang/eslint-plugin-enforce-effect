import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/ban-vanilla/no-nullish-coalescing.js";

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

ruleTester.run("no-nullish-coalescing", rule, {
  valid: [
    {
      code: "const value = condition ? left : right;",
    },
    {
      code: "const value = Option.getOrElse(option, () => fallback);",
    },
  ],
  invalid: [
    {
      code: "const value = input ?? fallback;",
      errors: [{ messageId: "noNullishCoalescing" }],
    },
    {
      code: "const value = foo() ?? bar();",
      errors: [{ messageId: "noNullishCoalescing" }],
    },
  ],
});
