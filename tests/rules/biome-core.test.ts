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

ruleTester.run("no-arrow-ladder", biomeRules["no-arrow-ladder"], {
  valid: [{ code: `${effectImport}\nconst wrapped = () => Effect.succeed(1);` }],
  invalid: [
    {
      code: `${effectImport}\nconst value = (() => (() => Effect.succeed(1))())();`,
      errors: [{ messageId: "noArrowLadder" }],
    },
  ],
});

ruleTester.run("no-branch-in-object", biomeRules["no-branch-in-object"], {
  valid: [
    {
      code: `${effectImport}\nconst current = Option.match(input, { onNone: () => 0, onSome: (value) => value });\nconst result = { current };`,
    },
  ],
  invalid: [
    {
      code: `${effectImport}\nconst result = { current: Option.match(input, { onNone: () => 0, onSome: (value) => value }) };`,
      errors: [{ messageId: "noBranchInObject" }],
    },
  ],
});

ruleTester.run("no-call-tower", biomeRules["no-call-tower"], {
  valid: [
    {
      code: `${effectImport}\nconst task = Effect.succeed(1);\nEffect.map(task, (value) => value + 1);`,
    },
  ],
  invalid: [
    {
      code: `${effectImport}\nEffect.map(Effect.succeed(1), (value) => value + 1);`,
      errors: [{ messageId: "noCallTower" }],
    },
  ],
});

ruleTester.run(
  "no-effect-all-step-sequencing",
  biomeRules["no-effect-all-step-sequencing"],
  {
    valid: [
      {
        code: `${effectImport}\nEffect.all([Effect.succeed(1), Effect.succeed(2)], { concurrency: 2 });`,
      },
    ],
    invalid: [
      {
        code: `${effectImport}\nEffect.all([Ref.set(counter, 1)], { concurrency: 1 });`,
        errors: [{ messageId: "noEffectAllStepSequencing" }],
      },
    ],
  },
);

ruleTester.run("no-effect-as", biomeRules["no-effect-as"], {
  valid: [{ code: `${effectImport}\nEffect.map(task, () => undefined);` }],
  invalid: [
    {
      code: `${effectImport}\nEffect.as(task, undefined);`,
      errors: [{ messageId: "noEffectAs" }],
    },
  ],
});

ruleTester.run("no-effect-async", biomeRules["no-effect-async"], {
  valid: [{ code: `${effectImport}\nEffect.succeed(1);` }],
  invalid: [
    {
      code: `${effectImport}\nEffect.async(() => {});`,
      errors: [{ messageId: "noEffectAsync" }],
    },
  ],
});

ruleTester.run("no-effect-bind", biomeRules["no-effect-bind"], {
  valid: [
    {
      code: `${effectImport}\nEffect.flatMap(task, (value) => Effect.succeed(value));`,
    },
  ],
  invalid: [
    {
      code: `${effectImport}\nEffect.bind(Effect.Do, "value", () => Effect.succeed(1));`,
      errors: [{ messageId: "noEffectBind" }],
    },
  ],
});

ruleTester.run(
  "no-effect-call-in-effect-arg",
  biomeRules["no-effect-call-in-effect-arg"],
  {
    valid: [
      {
        code: `${effectImport}\nconst task = Effect.succeed(1);\nEffect.map(task, (value) => value + 1);`,
      },
    ],
    invalid: [
      {
        code: `${effectImport}\nEffect.map(Effect.succeed(1), (value) => value + 1);`,
        errors: [{ messageId: "noEffectCallInEffectArg" }],
      },
    ],
  },
);

ruleTester.run("no-effect-do", biomeRules["no-effect-do"], {
  valid: [{ code: `${effectImport}\nEffect.gen(function* () { return 1; });` }],
  invalid: [
    {
      code: `${effectImport}\nEffect.Do;`,
      errors: [{ messageId: "noEffectDo" }],
    },
  ],
});

ruleTester.run("no-effect-fn-generator", biomeRules["no-effect-fn-generator"], {
  valid: [
    {
      code: `${effectImport}\nEffect.fn((value: number) => Effect.succeed(value));`,
    },
  ],
  invalid: [
    {
      code: `${effectImport}\nEffect.fn(function* () { yield* Effect.succeed(1); });`,
      errors: [{ messageId: "noEffectFnGenerator" }],
    },
  ],
});

ruleTester.run("no-effect-ladder", biomeRules["no-effect-ladder"], {
  valid: [{ code: `${effectImport}\nEffect.flatMap(task, nextTask);` }],
  invalid: [
    {
      code: `${effectImport}\nEffect.map(Effect.flatMap(Effect.succeed(1), (value) => Effect.succeed(value)), (value) => value);`,
      errors: [{ messageId: "noEffectLadder" }],
    },
  ],
});

ruleTester.run("no-effect-never", biomeRules["no-effect-never"], {
  valid: [{ code: `${effectImport}\nEffect.void;` }],
  invalid: [
    {
      code: `${effectImport}\nEffect.never;`,
      errors: [{ messageId: "noEffectNever" }],
    },
  ],
});

ruleTester.run(
  "no-effect-orElse-ladder",
  biomeRules["no-effect-orElse-ladder"],
  {
    valid: [{ code: `${effectImport}\nEffect.orElse(task, () => fallback);` }],
    invalid: [
      {
        code: `${effectImport}\nEffect.orElse(Effect.flatMap(task, (value) => Effect.succeed(value)), () => fallback);`,
        errors: [{ messageId: "noEffectOrElseLadder" }],
      },
    ],
  },
);

ruleTester.run(
  "no-effect-side-effect-wrapper",
  biomeRules["no-effect-side-effect-wrapper"],
  {
    valid: [{ code: `${effectImport}\nEffect.zipRight(task, otherTask);` }],
    invalid: [
      {
        code: `${effectImport}\nEffect.as(setState(value), undefined);`,
        errors: [{ messageId: "noEffectSideEffectWrapper" }],
      },
    ],
  },
);

ruleTester.run(
  "no-effect-succeed-variable",
  biomeRules["no-effect-succeed-variable"],
  {
    valid: [{ code: `${effectImport}\nEffect.succeed({ value });` }],
    invalid: [
      {
        code: `${effectImport}\nEffect.succeed(value);`,
        errors: [{ messageId: "noEffectSucceedVariable" }],
      },
    ],
  },
);

ruleTester.run(
  "no-effect-sync-console",
  biomeRules["no-effect-sync-console"],
  {
    valid: [{ code: `${effectImport}\nEffect.sync(() => 1);` }],
    invalid: [
      {
        code: `${effectImport}\nEffect.sync(() => { console.log("x"); });`,
        errors: [{ messageId: "noEffectSyncConsole" }],
      },
    ],
  },
);

ruleTester.run(
  "no-effect-wrapper-alias",
  biomeRules["no-effect-wrapper-alias"],
  {
    valid: [{ code: `${effectImport}\nconst build = () => 1;` }],
    invalid: [
      {
        code: `${effectImport}\nconst build = () => Effect.succeed(1);`,
        errors: [{ messageId: "noEffectWrapperAlias" }],
      },
    ],
  },
);

ruleTester.run("no-flatmap-ladder", biomeRules["no-flatmap-ladder"], {
  valid: [
    {
      code: `${effectImport}\nEffect.flatMap(task, (value) => Effect.succeed(value));`,
    },
  ],
  invalid: [
    {
      code: `${effectImport}\nEffect.flatMap(task, () => Effect.flatMap(otherTask, () => Effect.succeed(1)));`,
      errors: [{ messageId: "noFlatMapLadder" }],
    },
  ],
});

ruleTester.run("no-if-statement", biomeRules["no-if-statement"], {
  valid: [
    {
      code: `${effectImport}\nconst value = Option.match(input, { onNone: () => 0, onSome: (current) => current });`,
    },
  ],
  invalid: [
    {
      code: `${effectImport}\nif (input) {\n  Effect.succeed(1);\n}`,
      errors: [{ messageId: "noIfStatement" }],
    },
  ],
});

ruleTester.run("no-iife-wrapper", biomeRules["no-iife-wrapper"], {
  valid: [{ code: `${effectImport}\nconst build = () => Effect.succeed(1);` }],
  invalid: [
    {
      code: `${effectImport}\n(() => Effect.succeed(1))();`,
      errors: [{ messageId: "noIifeWrapper" }],
    },
  ],
});

ruleTester.run(
  "no-manual-effect-channels",
  biomeRules["no-manual-effect-channels"],
  {
    valid: [{ code: `${effectImport}\ntype Label = string;` }],
    invalid: [
      {
        code: `${effectImport}\ntype Task = Effect.Effect<string, Error>;`,
        errors: [{ messageId: "noManualEffectChannels" }],
      },
    ],
  },
);

ruleTester.run(
  "no-match-effect-branch",
  biomeRules["no-match-effect-branch"],
  {
    valid: [
      {
        code: `${effectImport}\nOption.match(input, { onNone: () => 0, onSome: (value) => value });`,
      },
    ],
    invalid: [
      {
        code: `${effectImport}\nOption.match(input, { onNone: () => Effect.void, onSome: () => Effect.flatMap(task, (value) => Effect.succeed(value)) });`,
        errors: [{ messageId: "noMatchEffectBranch" }],
      },
    ],
  },
);

ruleTester.run(
  "no-match-void-branch",
  biomeRules["no-match-void-branch"],
  {
    valid: [{ code: `${effectImport}\nMatch.when("ready", () => Effect.succeed("ready"));` }],
    invalid: [
      {
        code: `${effectImport}\nMatch.when("ready", () => Effect.void);`,
        errors: [{ messageId: "noMatchVoidBranch" }],
      },
    ],
  },
);

ruleTester.run(
  "no-nested-effect-call",
  biomeRules["no-nested-effect-call"],
  {
    valid: [{ code: `${effectImport}\nEffect.flatMap(task, () => Effect.succeed(2));` }],
    invalid: [
      {
        code: `${effectImport}\nEffect.flatMap(Effect.map(Effect.succeed(1), (value) => value), () => Effect.succeed(2));`,
        errors: [{ messageId: "noNestedEffectCall" }],
      },
    ],
  },
);

ruleTester.run(
  "no-nested-effect-gen",
  biomeRules["no-nested-effect-gen"],
  {
    valid: [
      {
        code: `${effectImport}\nEffect.gen(function* () { yield* Effect.succeed(1); });`,
      },
    ],
    invalid: [
      {
        code: `${effectImport}\nEffect.gen(function* () { yield* Effect.gen(function* () { yield* Effect.succeed(1); }); });`,
        errors: [{ messageId: "noNestedEffectGen" }],
      },
    ],
  },
);

ruleTester.run("no-option-as", biomeRules["no-option-as"], {
  valid: [{ code: `${effectImport}\nOption.map(input, () => 1);` }],
  invalid: [
    {
      code: `${effectImport}\nOption.as(input, 1);`,
      errors: [{ messageId: "noOptionAs" }],
    },
  ],
});

ruleTester.run("no-pipe-ladder", biomeRules["no-pipe-ladder"], {
  valid: [{ code: `${effectImport}\npipe(value, fn1, fn2);` }],
  invalid: [
    {
      code: `${effectImport}\npipe(value, (current) => pipe(current, fn1));`,
      errors: [{ messageId: "noPipeLadder" }],
    },
  ],
});

ruleTester.run(
  "no-return-in-arrow",
  biomeRules["no-return-in-arrow"],
  {
    valid: [{ code: `${effectImport}\nEffect.map(task, (value) => value + 1);` }],
    invalid: [
      {
        code: `${effectImport}\nEffect.map(task, (value) => { return value + 1; });`,
        errors: [{ messageId: "noReturnInArrow" }],
      },
    ],
  },
);

ruleTester.run(
  "no-return-in-callback",
  biomeRules["no-return-in-callback"],
  {
    valid: [
      {
        code: `${effectImport}\nEffect.flatMap(task, (value) => Effect.succeed(value));`,
      },
    ],
    invalid: [
      {
        code: `${effectImport}\nEffect.flatMap(task, function (value) { return Effect.succeed(value); });`,
        errors: [{ messageId: "noReturnInCallback" }],
      },
    ],
  },
);

ruleTester.run("no-return-null", biomeRules["no-return-null"], {
  valid: [{ code: `${effectImport}\nfunction run() { return Option.none(); }` }],
  invalid: [
    {
      code: `${effectImport}\nfunction run() { return null; }`,
      errors: [{ messageId: "noReturnNull" }],
    },
  ],
});

ruleTester.run("no-runtime-runfork", biomeRules["no-runtime-runfork"], {
  valid: [{ code: `${effectImport}\nRuntime.runPromise(runtime, task);` }],
  invalid: [
    {
      code: `${effectImport}\nRuntime.runFork(runtime, task);`,
      errors: [{ messageId: "noRuntimeRunFork" }],
    },
  ],
});

ruleTester.run(
  "no-switch-statement",
  biomeRules["no-switch-statement"],
  {
    valid: [{ code: `${effectImport}\nconst value = 1;` }],
    invalid: [
      {
        code: `${effectImport}\nswitch (input) {\n  case "a":\n    break;\n}`,
        errors: [{ messageId: "noSwitchStatement" }],
      },
    ],
  },
);

ruleTester.run("no-ternary", biomeRules["no-ternary"], {
  valid: [
    {
      code: `${effectImport}\nconst value = Option.match(input, { onNone: () => 0, onSome: (current) => current });`,
    },
  ],
  invalid: [
    {
      code: `${effectImport}\nconst value = input ? 1 : 2;`,
      errors: [{ messageId: "noTernary" }],
    },
  ],
});

ruleTester.run("no-try-catch", biomeRules["no-try-catch"], {
  valid: [{ code: `${effectImport}\nEffect.catchAll(task, () => fallback);` }],
  invalid: [
    {
      code: `${effectImport}\ntry {\n  work();\n} catch (error) {\n  handle(error);\n}`,
      errors: [{ messageId: "noTryCatch" }],
    },
  ],
});

ruleTester.run(
  "prevent-dynamic-imports",
  biomeRules["prevent-dynamic-imports"],
  {
    valid: [{ code: 'import value from "./static";' }],
    invalid: [
      {
        code: 'import("./lazy");',
        errors: [{ messageId: "preventDynamicImports" }],
      },
    ],
  },
);

ruleTester.run(
  "warn-effect-sync-wrapper",
  biomeRules["warn-effect-sync-wrapper"],
  {
    valid: [{ code: `${effectImport}\nEffect.sync(readValue);` }],
    invalid: [
      {
        code: `${effectImport}\nEffect.sync(() => sideEffect(value));`,
        errors: [{ messageId: "warnEffectSyncWrapper" }],
      },
    ],
  },
);
