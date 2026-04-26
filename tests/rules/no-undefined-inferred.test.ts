import path from "node:path";
import { fileURLToPath } from "node:url";

import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/ban-vanilla/no-undefined-inferred.js";

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

ruleTester.run("no-undefined-inferred", rule, {
  valid: [
    {
      code: "const n: number = 1;",
    },
    {
      code: "function add(a: number, b: number): number { return a + b; }",
    },
    {
      code: "class Counter { value = 0; }",
    },
    {
      code: "const xs = [1, 2, 3];",
    },
    {
      code: "function noop(): void {}",
    },
    {
      code: "const noopArrow = (): void => {};",
    },
    {
      code: [
        "interface Api { mustUser(): { name: string } }",
        "declare const api: Api;",
        "const user = api.mustUser();",
      ].join("\n"),
    },
    {
      code: [
        "interface OptionLike<A> { readonly _tag: 'Some' | 'None'; readonly value?: A }",
        "declare function some<A>(value: A): OptionLike<A>;",
        "const opt = some(1);",
        "function findFirst<T>(xs: readonly T[]): OptionLike<T> { return some(xs[0] as T); }",
      ].join("\n"),
    },
  ],
  invalid: [
    {
      code: [
        "declare const arr: number[];",
        "const first = arr.find((n) => n > 0);",
      ].join("\n"),
      errors: [{ messageId: "noUndefinedInferred" }],
    },
    {
      code: [
        "declare const map: Map<string, number>;",
        "const value = map.get('k');",
      ].join("\n"),
      errors: [{ messageId: "noUndefinedInferred" }],
    },
    {
      code: "function greet(name?: string) { return name; }",
      errors: [
        { messageId: "noUndefinedInferred" },
        { messageId: "noUndefinedInferred" },
      ],
    },
    {
      code: [
        "interface Config { admin?: { id: string } }",
        "declare const config: Config;",
        "const { admin } = config;",
      ].join("\n"),
      errors: [{ messageId: "noUndefinedInferred" }],
    },
    {
      code: [
        "interface Row { label: string | undefined }",
        "declare const rows: Row[];",
        "const labels = rows.map((r) => r.label);",
      ].join("\n"),
      errors: [
        { messageId: "noUndefinedInferred" },
        { messageId: "noUndefinedInferred" },
      ],
    },
    {
      code: [
        "interface Api { maybeUser(): { name: string } | undefined }",
        "declare const api: Api;",
        "class Cache { last = api.maybeUser(); }",
      ].join("\n"),
      errors: [{ messageId: "noUndefinedInferred" }],
    },
    {
      code: [
        "interface Api { maybeUser(): { name: string } | undefined }",
        "declare const api: Api;",
        "function load() { return api.maybeUser(); }",
      ].join("\n"),
      errors: [{ messageId: "noUndefinedInferred" }],
    },
    {
      code: [
        "interface Api { maybeUser(): { name: string } | undefined }",
        "declare const api: Api;",
        "const load = () => api.maybeUser();",
      ].join("\n"),
      errors: [{ messageId: "noUndefinedInferred" }],
    },
    {
      code: [
        "interface Api { maybeUser(): { name: string } | undefined }",
        "declare const api: Api;",
        "type Pair = readonly [string, ReturnType<typeof api.maybeUser>];",
        "declare const pair: Pair;",
        "const second = pair[1];",
      ].join("\n"),
      errors: [
        { messageId: "noUndefinedInferred" },
        { messageId: "noUndefinedInferred" },
      ],
    },
    {
      code: [
        "interface Api { maybeRows(): Array<{ name: string } | undefined> }",
        "declare const api: Api;",
        "const rows = api.maybeRows();",
      ].join("\n"),
      errors: [{ messageId: "noUndefinedInferred" }],
    },
  ],
});
