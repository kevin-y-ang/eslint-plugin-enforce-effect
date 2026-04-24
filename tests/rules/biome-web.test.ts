import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import { biomeRules } from "../../src/rules/biome/index.js";

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
  "no-atom-registry-effect-sync",
  biomeRules["no-atom-registry-effect-sync"],
  {
    valid: [
      {
        code: `${effectImport}\nimport { Atom } from "@effect-atom/atom-react";\nAtom.set(userAtom, 1);`,
      },
    ],
    invalid: [
      {
        code: `${effectImport}\nimport { Atom } from "@effect-atom/atom-react";\nEffect.sync(() => Atom.set(userAtom, 1));`,
        errors: [{ messageId: "noAtomRegistryEffectSync" }],
      },
    ],
  },
);

ruleTester.run(
  "no-inline-runtime-provide",
  biomeRules["no-inline-runtime-provide"],
  {
    valid: [
      {
        code: `${effectImport}\nfunction* run() {\n  yield* SomeRuntime.pipe(Effect.map((value) => value));\n}`,
      },
    ],
    invalid: [
      {
        code: `${effectImport}\nfunction* run() {\n  yield* SomeRuntime.pipe(Effect.provide(SomeRuntimeLive));\n}`,
        errors: [{ messageId: "noInlineRuntimeProvide" }],
      },
    ],
  },
);

ruleTester.run("no-react-state", biomeRules["no-react-state"], {
  valid: [{ code: "useMemo(() => value * 2, [value]);" }],
  invalid: [
    {
      code: "useState(0);",
      errors: [{ messageId: "noReactState" }],
    },
  ],
});

ruleTester.run(
  "no-render-side-effects",
  biomeRules["no-render-side-effects"],
  {
    valid: [
      {
        code: `${effectImport}\nconst rendered = Match.value(input).pipe(Match.when("ready", () => 1), Match.orElse(() => 0));`,
      },
    ],
    invalid: [
      {
        code: `${effectImport}\nMatch.value(input).pipe(Match.when("ready", () => Effect.succeed(1)), Match.orElse(() => Effect.void));`,
        errors: [{ messageId: "noRenderSideEffects" }],
      },
    ],
  },
);

ruleTester.run(
  "no-wrapgraphql-catchall",
  biomeRules["no-wrapgraphql-catchall"],
  {
    valid: [
      {
        code: `${effectImport}\npipe(fetchGraphql(query), Effect.catchAll(handleError));`,
      },
    ],
    invalid: [
      {
        code: `${effectImport}\npipe(wrapGraphqlCall(query), Effect.catchAll(handleError));`,
        errors: [{ messageId: "noWrapGraphqlCatchAll" }],
      },
    ],
  },
);
