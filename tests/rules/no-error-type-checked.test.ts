import path from "node:path";
import { fileURLToPath } from "node:url";

import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-error-type-checked.js";

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

ruleTester.run("no-error-type-checked", rule, {
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
    // Type-aware (inference-based) cases.
    {
      code: [
        "function load(): Error { return new Error('x'); }",
        "const e = load();",
      ].join("\n"),
      // `noErrorTypeChecked` on the function declaration node itself (return
      // type infers to `Error`), `noErrorType` on the literal `: Error`
      // annotation, `noErrorConstructor` on `new Error(...)`, and a second
      // `noErrorTypeChecked` on the `e` binding.
      errors: [
        { messageId: "noErrorTypeChecked" },
        { messageId: "noErrorType" },
        { messageId: "noErrorConstructor" },
        { messageId: "noErrorTypeChecked" },
      ],
    },
    {
      code: [
        "interface Result<T, E> { readonly ok: boolean; readonly error: E }",
        "declare const r: Result<number, Error>;",
        "const err = r.error;",
      ].join("\n"),
      errors: [
        { messageId: "noErrorType" },
        { messageId: "noErrorTypeChecked" },
      ],
    },
    {
      code: [
        "declare const cached: Map<string, Error>;",
        "const oops = cached.get('k');",
      ].join("\n"),
      errors: [
        { messageId: "noErrorType" },
        { messageId: "noErrorTypeChecked" },
      ],
    },
    {
      code: [
        "interface Row { failure: TypeError }",
        "declare const rows: Row[];",
        "const fails = rows.map((r) => r.failure);",
      ].join("\n"),
      errors: [
        { messageId: "noErrorTypeChecked" },
        { messageId: "noErrorTypeChecked" },
      ],
    },
    {
      code: [
        "interface Row { failure: Error }",
        "declare const row: Row;",
        "const { failure } = row;",
      ].join("\n"),
      errors: [
        { messageId: "noErrorType" },
        { messageId: "noErrorTypeChecked" },
      ],
    },
    {
      code: [
        "function makeError() { return new Error('boom'); }",
        "class Job { last = makeError(); }",
      ].join("\n"),
      errors: [
        { messageId: "noErrorTypeChecked" },
        { messageId: "noErrorConstructor" },
        { messageId: "noErrorTypeChecked" },
      ],
    },
    {
      code: [
        "function makeError() { return new RangeError('out'); }",
        "const e = makeError();",
      ].join("\n"),
      errors: [
        { messageId: "noErrorTypeChecked" },
        { messageId: "noErrorTypeChecked" },
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
        { messageId: "noErrorType" },
        { messageId: "noErrorTypeChecked" },
        { messageId: "noErrorTypeChecked" },
      ],
    },
    {
      code: [
        "function maybeError(): Error | undefined { return undefined; }",
        "const e = maybeError();",
      ].join("\n"),
      // `noErrorTypeChecked` on the function declaration return (the inferred
      // return type contains `Error`), `noErrorType` on the literal `: Error`
      // annotation, and `noErrorTypeChecked` on the `e` binding.
      errors: [
        { messageId: "noErrorTypeChecked" },
        { messageId: "noErrorType" },
        { messageId: "noErrorTypeChecked" },
      ],
    },
    // Pure syntactic cases — the type-checked rule must still catch them all.
    {
      code: "throw new Error('boom');",
      errors: [{ messageId: "noErrorConstructor" }],
    },
    {
      code: "const error = Error('boom');",
      // `noErrorTypeChecked` (binding has type `Error`) and
      // `noErrorConstructor` (the `Error()` call).
      errors: [
        { messageId: "noErrorTypeChecked" },
        { messageId: "noErrorConstructor" },
      ],
    },
    {
      code: "type Failure = Error | { readonly _tag: 'Failure' };",
      errors: [{ messageId: "noErrorType" }],
    },
  ],
});
