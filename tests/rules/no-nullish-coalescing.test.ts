import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-nullish-coalescing.js";

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
    {
      code: "const cached = Effect.cached(computeIt);",
    },
    {
      code: "let counter = 0; counter += 1;",
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
    {
      code: "let cache; cache ??= computeIt();",
      errors: [{ messageId: "noNullishCoalescingAssign" }],
    },
    {
      code: "config.title ??= \"Untitled\";",
      errors: [{ messageId: "noNullishCoalescingAssign" }],
    },
  ],
});
