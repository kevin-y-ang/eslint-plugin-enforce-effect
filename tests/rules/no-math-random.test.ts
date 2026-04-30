import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-math-random.js";

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

ruleTester.run("no-math-random", rule, {
  valid: [
    {
      code: "const value = yield* Random.next;",
    },
    {
      code: "const value = Math.floor(0.5);",
    },
    {
      code: "const value = Math.PI;",
    },
    {
      code: "const helper = { random: () => 0 }; helper.random();",
    },
    {
      code: "const value = obj.Math.random();",
    },
  ],
  invalid: [
    {
      code: "const value = Math.random();",
      errors: [{ messageId: "noMathRandom" }],
    },
    {
      code: "const value = Math['random']();",
      errors: [{ messageId: "noMathRandom" }],
    },
    {
      code: "const reference = Math.random;",
      errors: [{ messageId: "noMathRandom" }],
    },
    {
      code: "const scaled = Math.random() * 100;",
      errors: [{ messageId: "noMathRandom" }],
    },
  ],
});
