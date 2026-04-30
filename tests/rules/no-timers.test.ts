import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-timers.js";

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

ruleTester.run("no-timers", rule, {
  valid: [
    {
      code: "const program = Effect.sleep('1 second');",
    },
    {
      code: "yield* Effect.delay(Effect.succeed(1), '1 second');",
    },
    {
      code: "const helper = { setTimeout: () => 0 }; helper.setTimeout();",
    },
    {
      code: "const value = obj.setTimeout(handler, 1000);",
    },
  ],
  invalid: [
    {
      code: "setTimeout(handler, 1000);",
      errors: [{ messageId: "noTimers" }],
    },
    {
      code: "setInterval(handler, 1000);",
      errors: [{ messageId: "noTimers" }],
    },
    {
      code: "clearTimeout(token);",
      errors: [{ messageId: "noTimers" }],
    },
    {
      code: "clearInterval(token);",
      errors: [{ messageId: "noTimers" }],
    },
    {
      code: "queueMicrotask(handler);",
      errors: [{ messageId: "noTimers" }],
    },
    {
      code: "setImmediate(handler);",
      errors: [{ messageId: "noTimers" }],
    },
    {
      code: "globalThis.setTimeout(handler, 0);",
      errors: [{ messageId: "noTimers" }],
    },
    {
      code: "window.setInterval(handler, 0);",
      errors: [{ messageId: "noTimers" }],
    },
    {
      code: "globalThis['queueMicrotask'](handler);",
      errors: [{ messageId: "noTimers" }],
    },
  ],
});
