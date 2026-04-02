import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-try.js";

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

ruleTester.run("no-try", rule, {
  valid: [
    {
      code: "const value = Effect.succeed(1);",
    },
    {
      code: "function unsafe() { return value; }",
    },
  ],
  invalid: [
    {
      code: "try { work(); } catch (error) { handle(error); }",
      errors: [{ messageId: "noTry" }],
    },
    {
      code: "async function run() { try { await work(); } finally { cleanup(); } }",
      errors: [{ messageId: "noTry" }],
    },
  ],
});
