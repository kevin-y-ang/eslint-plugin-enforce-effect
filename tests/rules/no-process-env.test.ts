import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/ban-vanilla/no-process-env.js";

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

ruleTester.run("no-process-env", rule, {
  valid: [
    {
      code: "const args = process.argv;",
    },
    {
      code: "const env = config.env;",
    },
  ],
  invalid: [
    {
      code: "const env = process.env;",
      errors: [{ messageId: "noProcessEnv" }],
    },
    {
      code: "const nodeEnv = process.env.NODE_ENV;",
      errors: [{ messageId: "noProcessEnv" }],
    },
    {
      code: "const nodeEnv = process['env'].NODE_ENV;",
      errors: [{ messageId: "noProcessEnv" }],
    },
  ],
});
