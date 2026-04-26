import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/ban-vanilla/no-date.js";

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

ruleTester.run("no-date", rule, {
  valid: [
    {
      code: "const program = Effect.gen(function* () { return yield* DateTime.now; });",
    },
    {
      code: "const millis = yield* Clock.currentTimeMillis;",
    },
    {
      code: "const stamp = DateTime.nowUnsafe();",
    },
    {
      code: "const stamp = DateTime.makeUnsafe({ year: 2024, month: 1, day: 1 });",
    },
    {
      code: "const myDate = otherModule.Date();",
    },
    {
      code: "const myDate = new other.Date();",
    },
    {
      code: "function consume(stamp: DateTime.Utc) { return stamp; }",
    },
    {
      code: "function consume(stamp: DateTime.Zoned) { return stamp; }",
    },
    {
      code: "type Stamp = DateTime.DateTime | null;",
    },
    {
      code: "type Other = DateTime;",
    },
    {
      code: "const helper = { now: () => 0 }; helper.now();",
    },
    {
      code: "const value = otherDate.now();",
    },
    {
      code: "const value = obj.Date.now();",
    },
    {
      code: "const reference = Date.now;",
    },
  ],
  invalid: [
    {
      code: "const stamp = new Date();",
      errors: [{ messageId: "noDateConstructor" }],
    },
    {
      code: "const stamp = new Date('2024-01-01T00:00:00Z');",
      errors: [{ messageId: "noDateConstructor" }],
    },
    {
      code: "const stamp = new Date(2024, 0, 1);",
      errors: [{ messageId: "noDateConstructor" }],
    },
    {
      code: "const stamp = Date();",
      errors: [{ messageId: "noDateConstructor" }],
    },
    {
      code: "function consume(stamp: Date) { return stamp; }",
      errors: [{ messageId: "noDateType" }],
    },
    {
      code: "const stamp: Date = issue;",
      errors: [{ messageId: "noDateType" }],
    },
    {
      code: "type Stamp = Date | null;",
      errors: [{ messageId: "noDateType" }],
    },
    {
      code: "function returnsDate(): Date { return value; }",
      errors: [{ messageId: "noDateType" }],
    },
    {
      code: "const millis = Date.now();",
      errors: [{ messageId: "noDateNow" }],
    },
    {
      code: "const elapsed = Date.now() - start;",
      errors: [{ messageId: "noDateNow" }],
    },
    {
      code: "const millis = Date['now']();",
      errors: [{ messageId: "noDateNow" }],
    },
    {
      code: "if (Date.now() > deadline) { fail(); }",
      errors: [{ messageId: "noDateNow" }],
    },
  ],
});
