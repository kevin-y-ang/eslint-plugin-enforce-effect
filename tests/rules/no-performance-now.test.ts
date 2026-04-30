import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-performance-now.js";

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

ruleTester.run("no-performance-now", rule, {
  valid: [
    {
      code: "const millis = yield* Clock.currentTimeMillis;",
    },
    {
      code: "const elapsed = performance.timeOrigin;",
    },
    {
      code: "const helper = { performance: { now: () => 0 } }; helper.performance.now();",
    },
    {
      code: "const value = obj.performance.now();",
    },
  ],
  invalid: [
    {
      code: "const stamp = performance.now();",
      errors: [{ messageId: "noPerformanceNow" }],
    },
    {
      code: "const stamp = performance['now']();",
      errors: [{ messageId: "noPerformanceNow" }],
    },
    {
      code: "const reference = performance.now;",
      errors: [{ messageId: "noPerformanceNow" }],
    },
    {
      code: "const stamp = globalThis.performance.now();",
      errors: [{ messageId: "noPerformanceNow" }],
    },
    {
      code: "const stamp = window.performance.now();",
      errors: [{ messageId: "noPerformanceNow" }],
    },
  ],
});
