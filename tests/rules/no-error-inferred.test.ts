import path from "node:path";
import { fileURLToPath } from "node:url";

import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/ban-vanilla/no-error-inferred.js";

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

ruleTester.run("no-error-inferred", rule, {
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
        "interface CauseLike<E> { readonly _tag: 'Fail' | 'Die'; readonly error: E }",
        "declare function fail<E>(e: E): CauseLike<E>;",
        "const c = fail({ _tag: 'NotFound', id: 'x' } as const);",
      ].join("\n"),
    },
    {
      code: [
        "interface YieldableErrorLike { readonly _tag: string; readonly message: string }",
        "declare class TaggedError implements YieldableErrorLike {",
        "  readonly _tag: string;",
        "  readonly message: string;",
        "}",
        "function makeTagged(): TaggedError { return new TaggedError(); }",
      ].join("\n"),
    },
  ],
  invalid: [
    {
      code: [
        "function load(): Error { return new Error('x'); }",
        "const e = load();",
      ].join("\n"),
      errors: [
        { messageId: "noErrorInferred" },
        { messageId: "noErrorInferred" },
      ],
    },
    {
      code: [
        "interface Result<T, E> { readonly ok: boolean; readonly error: E }",
        "declare const r: Result<number, Error>;",
        "const err = r.error;",
      ].join("\n"),
      errors: [{ messageId: "noErrorInferred" }],
    },
    {
      code: [
        "declare const cached: Map<string, Error>;",
        "const oops = cached.get('k');",
      ].join("\n"),
      errors: [{ messageId: "noErrorInferred" }],
    },
    {
      code: [
        "interface Row { failure: TypeError }",
        "declare const rows: Row[];",
        "const fails = rows.map((r) => r.failure);",
      ].join("\n"),
      errors: [
        { messageId: "noErrorInferred" },
        { messageId: "noErrorInferred" },
      ],
    },
    {
      code: [
        "interface Row { failure: Error }",
        "declare const row: Row;",
        "const { failure } = row;",
      ].join("\n"),
      errors: [{ messageId: "noErrorInferred" }],
    },
    {
      code: [
        "function makeError() { return new Error('boom'); }",
        "class Job { last = makeError(); }",
      ].join("\n"),
      errors: [
        { messageId: "noErrorInferred" },
        { messageId: "noErrorInferred" },
      ],
    },
    {
      code: [
        "function makeError() { return new RangeError('out'); }",
        "const e = makeError();",
      ].join("\n"),
      errors: [
        { messageId: "noErrorInferred" },
        { messageId: "noErrorInferred" },
      ],
    },
    {
      code: [
        "interface Api { makeError(): Error }",
        "declare const api: Api;",
        "type Pair = readonly [string, ReturnType<typeof api.makeError>];",
        "declare const pair: Pair;",
        "const second = pair[1];",
      ].join("\n"),
      errors: [
        { messageId: "noErrorInferred" },
        { messageId: "noErrorInferred" },
      ],
    },
    {
      code: [
        "function maybeError(): Error | undefined { return undefined; }",
        "const e = maybeError();",
      ].join("\n"),
      errors: [
        { messageId: "noErrorInferred" },
        { messageId: "noErrorInferred" },
      ],
    },
  ],
});
