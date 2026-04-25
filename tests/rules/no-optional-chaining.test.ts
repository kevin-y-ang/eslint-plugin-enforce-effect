import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/ban-vanilla/no-optional-chaining.js";

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

ruleTester.run("no-optional-chaining", rule, {
  valid: [
    {
      code: "const value = user.profile.name;",
    },
    {
      code: "const result = fn(value);",
    },
  ],
  invalid: [
    {
      code: "const value = user?.profile;",
      errors: [{ messageId: "noOptionalChaining" }],
    },
    {
      code: "const value = user.profile?.name;",
      errors: [{ messageId: "noOptionalChaining" }],
    },
    {
      code: "const value = fn?.();",
      errors: [{ messageId: "noOptionalChaining" }],
    },
  ],
});
