import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-or.js";

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

ruleTester.run("no-or", rule, {
  valid: [
    {
      code: "const flag = Boolean.or(isOwner, isAdmin);",
    },
    {
      code: "const label = Option.getOrElse(maybeLabel, () => \"fallback\");",
    },
    {
      code: "const recovered = Effect.catch(program, () => fallback);",
    },
    {
      code: "const chained = Option.orElse(first, () => second);",
    },
    {
      code: "const bitwise = a | b;",
    },
    {
      code: "const updated = Ref.updateSome(ref, (value) => value ? Option.none() : Option.some(next));",
    },
    {
      code: "let counter = 0; counter += 1;",
    },
  ],
  invalid: [
    {
      code: "const label = primary || backup;",
      errors: [{ messageId: "noOr" }],
    },
    {
      code: "const name = user.name || \"anonymous\";",
      errors: [{ messageId: "noOr" }],
    },
    {
      code: "const resolved = readEnv() || readDefault();",
      errors: [{ messageId: "noOr" }],
    },
    {
      code: "let label = cached; label ||= \"fallback\";",
      errors: [{ messageId: "noOrAssign" }],
    },
    {
      code: "config.title ||= \"Untitled\";",
      errors: [{ messageId: "noOrAssign" }],
    },
  ],
});
