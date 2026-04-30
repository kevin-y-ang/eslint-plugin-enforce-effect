import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-switch.js";

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

ruleTester.run("no-switch", rule, {
  valid: [
    {
      code: "if (tag === 'a') { return 1; } return 2;",
    },
    {
      code: "const value = handlers[tag]();",
    },
  ],
  invalid: [
    {
      code: "switch (tag) { case 'a': return 1; default: return 2; }",
      errors: [{ messageId: "noSwitch" }],
    },
    {
      code: "switch (value) { case 1: break; }",
      errors: [{ messageId: "noSwitch" }],
    },
  ],
});
