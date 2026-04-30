import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-console.js";

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

ruleTester.run("no-console", rule, {
  valid: [
    {
      code: "yield* Effect.log('hello');",
    },
    {
      code: "yield* Effect.logError('boom');",
    },
    {
      code: "const helper = { console: { log: () => 0 } }; helper.console.log();",
    },
    {
      code: "const value = obj.console.log('hi');",
    },
  ],
  invalid: [
    {
      code: "console.log('hi');",
      errors: [{ messageId: "noConsole" }],
    },
    {
      code: "console.error('boom');",
      errors: [{ messageId: "noConsole" }],
    },
    {
      code: "console.warn('uh oh');",
      errors: [{ messageId: "noConsole" }],
    },
    {
      code: "console['log']('hi');",
      errors: [{ messageId: "noConsole" }],
    },
    {
      code: "globalThis.console.log('hi');",
      errors: [{ messageId: "noConsole" }],
    },
    {
      code: "window.console.error('boom');",
      errors: [{ messageId: "noConsole" }],
    },
  ],
});
