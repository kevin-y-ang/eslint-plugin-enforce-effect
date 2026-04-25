import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/ban-vanilla/no-for.js";

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

ruleTester.run("no-for", rule, {
  valid: [
    {
      code: "items.map((item) => item.id);",
    },
    {
      code: "while (ready) { consume(); }",
    },
  ],
  invalid: [
    {
      code: "for (let index = 0; index < items.length; index += 1) { work(items[index]); }",
      errors: [{ messageId: "noFor" }],
    },
    {
      code: "for (const key in record) { work(key); }",
      errors: [{ messageId: "noFor" }],
    },
    {
      code: "for (const item of items) { work(item); }",
      errors: [{ messageId: "noFor" }],
    },
  ],
});
