import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-type-assertion.js";

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

ruleTester.run("no-type-assertion", rule, {
  valid: [
    {
      code: "if (typeof value === 'string') { consume(value); }",
    },
    {
      code: "const parsed = Schema.decodeUnknownSync(User)(input);",
    },
    {
      code: "const value = 'hello';",
    },
    {
      code: "let value; value = 1;",
    },
    {
      code: "let pending: number; pending = 1;",
    },
    {
      code: "function takes(x: number) { return x; }",
    },
    {
      code: "const fn = (x: number, y: string) => x + y.length;",
    },
    {
      code: "class Foo { method(x: number): number { return x; } }",
    },
  ],
  invalid: [
    {
      code: "const value = input as string;",
      errors: [{ messageId: "noAsAssertion" }],
    },
    {
      code: "const value = <string>input;",
      errors: [{ messageId: "noAngleAssertion" }],
    },
    {
      code: "const value: string = 'hello';",
      errors: [{ messageId: "noVariableTypeAnnotation" }],
    },
    {
      code: "let value: number = 1;",
      errors: [{ messageId: "noVariableTypeAnnotation" }],
    },
    {
      code: "var value: boolean = true;",
      errors: [{ messageId: "noVariableTypeAnnotation" }],
    },
    {
      code: "const { a, b }: { a: number; b: string } = pair;",
      errors: [{ messageId: "noVariableTypeAnnotation" }],
    },
    {
      code: "const [a, b]: [number, string] = pair;",
      errors: [{ messageId: "noVariableTypeAnnotation" }],
    },
    {
      code: "const value: string = input as string;",
      errors: [
        { messageId: "noVariableTypeAnnotation" },
        { messageId: "noAsAssertion" },
      ],
    },
  ],
});
