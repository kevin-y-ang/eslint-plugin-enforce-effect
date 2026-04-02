import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-promise.js";

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

ruleTester.run("no-promise", rule, {
  valid: [
    {
      code: "Effect.succeed(1);",
    },
    {
      code: "const task = makePromise();",
    },
    {
      code: "const parser = stream.handleError(handler);",
    },
    {
      code: "const program = Effect.gen(function* () { return yield* task; });",
    },
  ],
  invalid: [
    {
      code: "new Promise((resolve) => resolve(1));",
      errors: [{ messageId: "noPromiseConstructor" }],
    },
    {
      code: "Promise.resolve(1);",
      errors: [{ messageId: "noPromiseStatic" }],
    },
    {
      code: "Promise.all(tasks);",
      errors: [{ messageId: "noPromiseStatic" }],
    },
    {
      code: "loadConfig().then(handle);",
      errors: [{ messageId: "noPromiseChain" }],
    },
    {
      code: "loadConfig()['catch'](handleError);",
      errors: [{ messageId: "noPromiseChain" }],
    },
    {
      code: "async function loadConfig() { return value; }",
      errors: [{ messageId: "noAsync" }],
    },
    {
      code: "const loadConfig = async () => value;",
      errors: [{ messageId: "noAsync" }],
    },
    {
      code: "async function loadConfig() { return await task; }",
      errors: [
        { messageId: "noAsync" },
        { messageId: "noAwait" },
      ],
    },
  ],
});
