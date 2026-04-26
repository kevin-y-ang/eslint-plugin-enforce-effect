import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import noDisableValidation from "../../src/rules/accountability/no-disable-validation.js";
import noEffectAsVoid from "../../src/rules/accountability/no-effect-asvoid.js";
import noEffectCatchAllCause from "../../src/rules/accountability/no-effect-catchallcause.js";
import noEffectIgnore from "../../src/rules/accountability/no-effect-ignore.js";
import noLocalStorage from "../../src/rules/accountability/no-localstorage.js";
import noLocationHrefRedirect from "../../src/rules/accountability/no-location-href-redirect.js";
import noNestedLayerProvide from "../../src/rules/accountability/no-nested-layer-provide.js";
import noServiceOption from "../../src/rules/accountability/no-service-option.js";
import noSilentErrorSwallow from "../../src/rules/accountability/no-silent-error-swallow.js";
import noSqlTypeParameter from "../../src/rules/accountability/no-sql-type-parameter.js";
import noVoidExpression from "../../src/rules/accountability/no-void-expression.js";
import pipeMaxArguments from "../../src/rules/accountability/pipe-max-arguments.js";
import preferOptionFromNullable from "../../src/rules/accountability/prefer-option-from-nullable.js";

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


ruleTester.run("no-disable-validation", noDisableValidation, {
  valid: [{ code: "const config = { disableValidation: false };" }],
  invalid: [
    {
      code: "const config = { disableValidation: true };",
      errors: [{ messageId: "noDisableValidation" }],
    },
  ],
});

ruleTester.run("no-sql-type-parameter", noSqlTypeParameter, {
  valid: [{ code: "const query = sql`select 1`;" }],
  invalid: [
    {
      code: "const query = sql<string>`select 1`;",
      errors: [{ messageId: "noSqlTypeParam" }],
    },
  ],
});

ruleTester.run("prefer-option-from-nullable", preferOptionFromNullable, {
  valid: [{ code: "const value = Option.fromNullable(input);" }],
  invalid: [
    {
      code: "const value = input !== null ? Option.some(input) : Option.none();",
      errors: [{ messageId: "preferFromNullable" }],
    },
  ],
});

ruleTester.run("no-localstorage", noLocalStorage, {
  valid: [{ code: "const current = store.localStorage;" }],
  invalid: [
    {
      code: "localStorage.getItem('token');",
      errors: [{ messageId: "noLocalStorage" }],
    },
  ],
});


ruleTester.run("pipe-max-arguments", pipeMaxArguments, {
  valid: [{ code: "value.pipe(a, b, c);" }],
  invalid: [
    {
      code: "value.pipe(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u);",
      errors: [{ messageId: "tooManyArgs" }],
    },
  ],
});

ruleTester.run("no-effect-asvoid", noEffectAsVoid, {
  valid: [{ code: "const value = Effect.map(task, () => undefined);" }],
  invalid: [
    {
      code: "const value = Effect.asVoid;",
      errors: [{ messageId: "noEffectAsVoid" }],
    },
  ],
});

ruleTester.run("no-effect-ignore", noEffectIgnore, {
  valid: [{ code: "const value = Effect.catchAll(task, recover);" }],
  invalid: [
    {
      code: "const value = Effect.ignore;",
      errors: [{ messageId: "noEffectIgnore" }],
    },
  ],
});

ruleTester.run("no-effect-catchallcause", noEffectCatchAllCause, {
  valid: [{ code: "const value = Effect.catchAll(task, recover);" }],
  invalid: [
    {
      code: "const value = Effect.catchAllCause;",
      errors: [{ messageId: "noEffectCatchAllCause" }],
    },
  ],
});

ruleTester.run("no-silent-error-swallow", noSilentErrorSwallow, {
  valid: [{ code: "const value = Effect.catchAll(() => Effect.fail(error));" }],
  invalid: [
    {
      code: "const value = Effect.catchAll(() => Effect.void);",
      errors: [{ messageId: "noSilentSwallow" }],
    },
  ],
});

ruleTester.run("no-void-expression", noVoidExpression, {
  valid: [{ code: "runTask();" }],
  invalid: [
    {
      code: "void runTask();",
      errors: [{ messageId: "noVoidExpression" }],
    },
  ],
});

ruleTester.run("no-service-option", noServiceOption, {
  valid: [{ code: "const service = yield* MyService;" }],
  invalid: [
    {
      code: "const service = Effect.serviceOption(MyService);",
      errors: [{ messageId: "noServiceOption" }],
    },
  ],
});

ruleTester.run("no-nested-layer-provide", noNestedLayerProvide, {
  valid: [{ code: "const layer = Layer.provide(Base, Dependency);" }],
  invalid: [
    {
      code: "const layer = Layer.provide(Base, Layer.provide(Dependency, Other));",
      errors: [{ messageId: "nestedProvide" }],
    },
  ],
});

ruleTester.run("no-location-href-redirect", noLocationHrefRedirect, {
  valid: [
    { code: "navigate({ to: '/dashboard' });" },
  ],
  invalid: [
    {
      code: "window.location.href = '/dashboard';",
      errors: [{ messageId: "noLocationHref" }],
    },
  ],
});

