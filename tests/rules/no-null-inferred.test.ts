import path from "node:path";
import { fileURLToPath } from "node:url";

import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/ban-vanilla/no-null-inferred.js";

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

ruleTester.run("no-null-inferred", rule, {
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
      code: [
        "interface Api { maybeUser(): { name: string } | undefined }",
        "declare const api: Api;",
        "const user = api.maybeUser();",
      ].join("\n"),
    },
    {
      code: [
        "interface OptionLike<A> { readonly _tag: 'Some' | 'None'; readonly value?: A }",
        "declare function some<A>(value: A): OptionLike<A>;",
        "const opt = some(1);",
        "function head<T>(xs: readonly T[]): OptionLike<T> { return some(xs[0] as T); }",
      ].join("\n"),
    },
  ],
  invalid: [
    {
      code: [
        "interface Api { findUser(): { name: string } | null }",
        "declare const api: Api;",
        "const user = api.findUser();",
      ].join("\n"),
      errors: [{ messageId: "noNullInferred" }],
    },
    {
      code: [
        "interface Row { label: string | null }",
        "declare const rows: Row[];",
        "const labels = rows.map((r) => r.label);",
      ].join("\n"),
      errors: [
        { messageId: "noNullInferred" },
        { messageId: "noNullInferred" },
      ],
    },
    {
      code: [
        "interface Row { label: string | null }",
        "declare const row: Row;",
        "const { label } = row;",
      ].join("\n"),
      errors: [{ messageId: "noNullInferred" }],
    },
    {
      code: [
        "interface Api { findUser(): { name: string } | null }",
        "declare const api: Api;",
        "class Cache { last = api.findUser(); }",
      ].join("\n"),
      errors: [{ messageId: "noNullInferred" }],
    },
    {
      code: [
        "interface Api { findUser(): { name: string } | null }",
        "declare const api: Api;",
        "function load() { return api.findUser(); }",
      ].join("\n"),
      errors: [{ messageId: "noNullInferred" }],
    },
    {
      code: [
        "interface Api { findUser(): { name: string } | null }",
        "declare const api: Api;",
        "const load = () => api.findUser();",
      ].join("\n"),
      errors: [{ messageId: "noNullInferred" }],
    },
    {
      code: [
        "interface Api { findUser(): { name: string } | null }",
        "declare const api: Api;",
        "type Pair = readonly [string, ReturnType<typeof api.findUser>];",
        "declare const pair: Pair;",
        "const second = pair[1];",
      ].join("\n"),
      errors: [
        { messageId: "noNullInferred" },
        { messageId: "noNullInferred" },
      ],
    },
    {
      code: [
        "interface Api { findRows(): Array<{ name: string } | null> }",
        "declare const api: Api;",
        "const rows = api.findRows();",
      ].join("\n"),
      errors: [{ messageId: "noNullInferred" }],
    },
    {
      code: [
        "function head<T>(xs: T[]): T | null { return xs.length > 0 ? (xs[0] as T) : null; }",
        "const h = head([1, 2, 3]);",
      ].join("\n"),
      errors: [
        { messageId: "noNullInferred" },
        { messageId: "noNullInferred" },
      ],
    },
  ],
});
