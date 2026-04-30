import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-json-stringify.js";

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

ruleTester.run("no-json-stringify", rule, {
  valid: [
    {
      code: "const encoded = Schema.encodeSync(Schema.toJsonString(Person))(value);",
    },
    {
      code: "const encoded = serializer.stringify(value);",
    },
    {
      code: "const parsed = JSON.parse(input);",
    },
  ],
  invalid: [
    {
      code: "const encoded = JSON.stringify(value);",
      errors: [{ messageId: "noJsonStringify" }],
    },
    {
      code: "const encoded = JSON['stringify'](value);",
      errors: [{ messageId: "noJsonStringify" }],
    },
    {
      code: "const encoded = JSON.stringify(value, null, 2);",
      errors: [{ messageId: "noJsonStringify" }],
    },
  ],
});
