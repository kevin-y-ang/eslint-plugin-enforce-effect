import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-type-assertion.js";

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

ruleTester.run("no-type-assertion", rule, {
  valid: [
    {
      code: "if (typeof value === 'string') { consume(value); }",
    },
    {
      code: "const parsed = Schema.decodeUnknownSync(User)(input);",
    },
  ],
  invalid: [
    {
      code: "const value = input as string;",
      errors: [{ messageId: "noTypeAssertion" }],
    },
    {
      code: "const value = <string>input;",
      errors: [{ messageId: "noTypeAssertion" }],
    },
  ],
});
