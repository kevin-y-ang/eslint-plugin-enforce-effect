import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-and.js";

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

ruleTester.run("no-and", rule, {
  valid: [
    {
      code: "const flag = Boolean.and(isOwner, hasWriteScope);",
    },
    {
      code: "const chained = Option.flatMap(first, () => second);",
    },
    {
      code: "const next = Effect.andThen(program, followUp);",
    },
    {
      code: "const refined = Effect.filterOrFail(program, isPositive, () => \"nope\");",
    },
    {
      code: "const bitwise = a & b;",
    },
    {
      code: "ref = Ref.updateSome(ref, (value) => value ? Option.some(next) : Option.none());",
    },
    {
      code: "let counter = 0; counter += 1;",
    },
  ],
  invalid: [
    {
      code: "const canEdit = isOwner && hasWriteScope;",
      errors: [{ messageId: "noAnd" }],
    },
    {
      code: "const guarded = user && user.name;",
      errors: [{ messageId: "noAnd" }],
    },
    {
      code: "const ran = shouldRun() && perform();",
      errors: [{ messageId: "noAnd" }],
    },
    {
      code: "let name = \"ada\"; name &&= name.toUpperCase();",
      errors: [{ messageId: "noAndAssign" }],
    },
    {
      code: "let active = flag; active &&= ready;",
      errors: [{ messageId: "noAndAssign" }],
    },
  ],
});
