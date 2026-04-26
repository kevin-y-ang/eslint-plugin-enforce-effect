import path from "node:path";
import { fileURLToPath } from "node:url";

import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/ban-vanilla/no-promise-inferred.js";

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

ruleTester.run("no-promise-inferred", rule, {
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
  ],
  invalid: [
    {
      code: [
        "interface Api { fetchUser(): Promise<{ name: string }> }",
        "declare const api: Api;",
        "const user = api.fetchUser();",
      ].join("\n"),
      errors: [{ messageId: "noPromiseInferred" }],
    },
    {
      code: [
        "interface Api { fetchUser(): Promise<{ name: string }> }",
        "declare const api: Api;",
        "function load(handle = api.fetchUser()) { return handle; }",
      ].join("\n"),
      errors: [
        { messageId: "noPromiseInferred" },
        { messageId: "noPromiseInferred" },
      ],
    },
    {
      code: [
        "interface Loader { load(): Promise<number> }",
        "declare const loaders: Loader[];",
        "const handles = loaders.map((l) => l.load());",
      ].join("\n"),
      errors: [
        { messageId: "noPromiseInferred" },
        { messageId: "noPromiseInferred" },
      ],
    },
    {
      code: [
        "interface Api { fetchUser(): Promise<{ name: string }> }",
        "declare const api: Api;",
        "class Job { result = api.fetchUser(); }",
      ].join("\n"),
      errors: [{ messageId: "noPromiseInferred" }],
    },
    {
      code: [
        "interface Api { fetchUser(): Promise<{ name: string }> }",
        "declare const api: Api;",
        "function load() { return api.fetchUser(); }",
      ].join("\n"),
      errors: [{ messageId: "noPromiseInferred" }],
    },
    {
      code: [
        "interface Api { fetchUser(): Promise<{ name: string }> }",
        "declare const api: Api;",
        "const load = () => api.fetchUser();",
      ].join("\n"),
      errors: [{ messageId: "noPromiseInferred" }],
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
        { messageId: "noPromiseInferred" },
        { messageId: "noPromiseInferred" },
      ],
    },
    {
      code: [
        "interface Row { handle: Promise<number> }",
        "declare const row: Row;",
        "const { handle } = row;",
      ].join("\n"),
      errors: [{ messageId: "noPromiseInferred" }],
    },
    {
      code: [
        "interface Api { maybeLoad(): Promise<number> | undefined }",
        "declare const api: Api;",
        "const handle = api.maybeLoad();",
      ].join("\n"),
      errors: [{ messageId: "noPromiseInferred" }],
    },
    {
      code: [
        "interface Thenable { then<T>(cb: (v: number) => T): PromiseLike<T> }",
        "declare const t: Thenable;",
        "const next = t.then((n) => n + 1);",
      ].join("\n"),
      errors: [{ messageId: "noPromiseInferred" }],
    },
    {
      code: "async function load() { return 1; }",
      errors: [{ messageId: "noPromiseInferred" }],
    },
  ],
});
