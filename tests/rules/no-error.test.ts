import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/ban-vanilla/no-error.js";

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

ruleTester.run("no-error", rule, {
  valid: [
    {
      code: "const failure = Cause.fail(reason);",
    },
    {
      code: "type Failure = { readonly _tag: 'Failure'; readonly message: string };",
    },
    {
      code: "const createError = () => issue;",
    },
  ],
  invalid: [
    {
      code: "throw new Error('boom');",
      errors: [{ messageId: "noErrorConstructor" }],
    },
    {
      code: "const error = Error('boom');",
      errors: [{ messageId: "noErrorConstructor" }],
    },
    {
      code: "type Failure = Error | { readonly _tag: 'Failure' };",
      errors: [{ messageId: "noErrorType" }],
    },
    {
      code: "const error: Error = issue;",
      errors: [{ messageId: "noErrorType" }],
    },
  ],
});
