import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-json-parse.js";

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

ruleTester.run("no-json-parse", rule, {
  valid: [
    {
      code: "const parsed = Schema.decodeUnknownSync(Config)(input);",
    },
    {
      code: "const parsed = parser.parse(input);",
    },
  ],
  invalid: [
    {
      code: "const parsed = JSON.parse(input);",
      errors: [{ messageId: "noJsonParse" }],
    },
    {
      code: "const parsed = JSON['parse'](input);",
      errors: [{ messageId: "noJsonParse" }],
    },
  ],
});
