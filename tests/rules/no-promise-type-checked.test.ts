import path from "node:path";
import { fileURLToPath } from "node:url";

import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-promise-type-checked.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.itSkip = it.skip;

const tsconfigRootDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures/type-aware",
);

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      project: "./tsconfig.json",
      tsconfigRootDir,
    },
  },
});

ruleTester.run("no-promise-type-checked", rule, {
  valid: [
    {
      code: "const n = 1;",
    },
    {
      code: "function add(a: number, b: number): number { return a + b; }",
    },
    {
      code: "class Counter { value = 0; }",
    },
    {
      code: [
        "interface Api { getCount(): number }",
        "declare const api: Api;",
        "const count = api.getCount();",
      ].join("\n"),
    },
    {
      code: [
        "interface EffectLike<out A, out E = never, out R = never> {",
        "  readonly _A: (_: never) => A;",
        "  readonly _E: (_: never) => E;",
        "  readonly _R: (_: never) => R;",
        "}",
        "declare function makeEffect<A>(value: A): EffectLike<A>;",
        "const eff = makeEffect(123);",
        "function returnEffect(): EffectLike<string> { return makeEffect('x'); }",
      ].join("\n"),
    },
    {
      code: "declare const Effect: { then<A, B>(f: (a: A) => B): B }; Effect.then((x) => x);",
    },
  ],
  invalid: [
    // Type-aware (inference-based) cases.
    {
      code: [
        "interface Api { fetchUser(): Promise<{ name: string }> }",
        "declare const api: Api;",
        "const user = api.fetchUser();",
      ].join("\n"),
      errors: [{ messageId: "noPromiseTypeChecked" }],
    },
    {
      code: [
        "interface Api { fetchUser(): Promise<{ name: string }> }",
        "declare const api: Api;",
        "function load(handle = api.fetchUser()) { return handle; }",
      ].join("\n"),
      errors: [
        { messageId: "noPromiseTypeChecked" },
        { messageId: "noPromiseTypeChecked" },
      ],
    },
    {
      code: [
        "interface Loader { load(): Promise<number> }",
        "declare const loaders: Loader[];",
        "const handles = loaders.map((l) => l.load());",
      ].join("\n"),
      errors: [
        { messageId: "noPromiseTypeChecked" },
        { messageId: "noPromiseTypeChecked" },
      ],
    },
    {
      code: [
        "interface Api { fetchUser(): Promise<{ name: string }> }",
        "declare const api: Api;",
        "class Job { result = api.fetchUser(); }",
      ].join("\n"),
      errors: [{ messageId: "noPromiseTypeChecked" }],
    },
    {
      code: [
        "interface Api { fetchUser(): Promise<{ name: string }> }",
        "declare const api: Api;",
        "function load() { return api.fetchUser(); }",
      ].join("\n"),
      errors: [{ messageId: "noPromiseTypeChecked" }],
    },
    {
      code: [
        "interface Api { fetchUser(): Promise<{ name: string }> }",
        "declare const api: Api;",
        "const load = () => api.fetchUser();",
      ].join("\n"),
      errors: [{ messageId: "noPromiseTypeChecked" }],
    },
    {
      code: [
        "interface Api { fetchUser(): Promise<{ name: string }> }",
        "declare const api: Api;",
        "type Pair = readonly [string, ReturnType<typeof api.fetchUser>];",
        "declare const pair: Pair;",
        "const second = pair[1];",
      ].join("\n"),
      errors: [
        { messageId: "noPromiseTypeChecked" },
        { messageId: "noPromiseTypeChecked" },
      ],
    },
    {
      code: [
        "interface Row { handle: Promise<number> }",
        "declare const row: Row;",
        "const { handle } = row;",
      ].join("\n"),
      errors: [{ messageId: "noPromiseTypeChecked" }],
    },
    {
      code: [
        "interface Api { maybeLoad(): Promise<number> | undefined }",
        "declare const api: Api;",
        "const handle = api.maybeLoad();",
      ].join("\n"),
      errors: [{ messageId: "noPromiseTypeChecked" }],
    },
    {
      code: [
        "interface Thenable { then<T>(cb: (v: number) => T): PromiseLike<T> }",
        "declare const t: Thenable;",
        "const next = t.then((n) => n + 1);",
      ].join("\n"),
      // Both the type-aware `PromiseLike` binding check AND the syntactic
      // `.then(...)` chain check fire — that's the superset behavior. The
      // `next` binding is reported first because its column comes earlier
      // in the source than the `t.then(...)` call.
      errors: [
        { messageId: "noPromiseTypeChecked" },
        { messageId: "noPromiseChainThen" },
      ],
    },
    {
      code: "async function load() { return 1; }",
      // `noAsync` from the syntactic check, plus `noPromiseTypeChecked` from
      // the inferred `Promise<number>` return type.
      errors: [
        { messageId: "noAsync" },
        { messageId: "noPromiseTypeChecked" },
      ],
    },
    // Pure syntactic cases — the type-checked rule must still catch them all.
    {
      code: "new Promise((resolve) => resolve(1));",
      errors: [{ messageId: "noPromiseConstructor" }],
    },
    {
      code: "Promise.resolve(1);",
      errors: [{ messageId: "noPromiseStatic" }],
    },
    {
      code: "Promise.all(tasks);",
      errors: [{ messageId: "noPromiseStatic" }],
    },
    {
      code: "loadConfig().then(handle);",
      errors: [{ messageId: "noPromiseChainThen" }],
    },
    {
      code: "loadConfig()['catch'](handleError);",
      errors: [{ messageId: "noPromiseChainCatch" }],
    },
    {
      code: "const loadConfig = async () => value;",
      // `noAsync` from the syntactic check, plus `noPromiseTypeChecked` because
      // the arrow function's inferred return type is `Promise<...>`.
      errors: [
        { messageId: "noAsync" },
        { messageId: "noPromiseTypeChecked" },
      ],
    },
    {
      code: "async function loadConfig() { await 1; return 1; }",
      // `noAsync` (function is async), `noPromiseTypeChecked` because the
      // inferred return is `Promise<number>`, and `noAwait` (await expression).
      errors: [
        { messageId: "noAsync" },
        { messageId: "noPromiseTypeChecked" },
        { messageId: "noAwait" },
      ],
    },
  ],
});
