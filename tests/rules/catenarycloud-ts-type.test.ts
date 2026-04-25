import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import { catenarycloudRules } from "../../src/rules/catenarycloud/index.js";

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

const effectImport =
  'import { Effect, Match, Option, Ref, Runtime } from "effect";';

ruleTester.run(
  "no-effect-type-alias",
  catenarycloudRules["no-effect-type-alias"],
  {
    valid: [{ code: `${effectImport}\ninterface Service { run(): Effect.Effect<number>; }` }],
    invalid: [
      {
        code: `${effectImport}\ntype Task = Effect.Effect<number>;`,
        errors: [{ messageId: "noEffectTypeAlias" }],
      },
    ],
  },
);

ruleTester.run(
  "no-fromnullable-nullish-coalesce",
  catenarycloudRules["no-fromnullable-nullish-coalesce"],
  {
    valid: [{ code: `${effectImport}\nOption.fromNullable(input);` }],
    invalid: [
      {
        code: `${effectImport}\nOption.fromNullable(input ?? null);`,
        errors: [{ messageId: "noFromNullableNullishCoalesce" }],
      },
    ],
  },
);

ruleTester.run(
  "no-model-overlay-cast",
  catenarycloudRules["no-model-overlay-cast"],
  {
    valid: [{ code: `${effectImport}\nconst overlay = decoded as const;` }],
    invalid: [
      {
        code: `${effectImport}\nconst overlay = decoded as Overlay;`,
        errors: [{ messageId: "noModelOverlayCast" }],
      },
    ],
  },
);

ruleTester.run(
  "no-option-boolean-normalization",
  catenarycloudRules["no-option-boolean-normalization"],
  {
    valid: [
      {
        code: `${effectImport}\nOption.match(input, { onSome: (value) => value, onNone: () => false });`,
      },
    ],
    invalid: [
      {
        code: `${effectImport}\nOption.match(input, { onSome: (value) => value === true, onNone: () => false });`,
        errors: [{ messageId: "noOptionBooleanNormalization" }],
      },
    ],
  },
);

ruleTester.run(
  "no-unknown-boolean-coercion-helper",
  catenarycloudRules["no-unknown-boolean-coercion-helper"],
  {
    valid: [{ code: `${effectImport}\nconst isBoolean = typeof value === "boolean";` }],
    invalid: [
      {
        code: `${effectImport}\nconst isBoolean = typeof value === "boolean";\nMatch.orElse(() => null);`,
        errors: [{ messageId: "noUnknownBooleanCoercionHelper" }],
      },
    ],
  },
);

ruleTester.run(
  "no-string-sentinel-const",
  catenarycloudRules["no-string-sentinel-const"],
  {
    valid: [{ code: `${effectImport}\nconst status = 1;` }],
    invalid: [
      {
        code: `${effectImport}\nconst status = "missing";`,
        errors: [{ messageId: "noStringSentinelConst" }],
      },
    ],
  },
);

ruleTester.run(
  "no-string-sentinel-return",
  catenarycloudRules["no-string-sentinel-return"],
  {
    valid: [{ code: `${effectImport}\nEffect.succeed({ tag: "missing" });` }],
    invalid: [
      {
        code: `${effectImport}\nEffect.succeed("missing");`,
        errors: [{ messageId: "noStringSentinelReturn" }],
      },
    ],
  },
);
