import path from "node:path";
import { fileURLToPath } from "node:url";

import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-date-type-checked.js";

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

ruleTester.run("no-date-type-checked", rule, {
  valid: [
    {
      code: "const stamp = 'not a date';",
    },
    {
      code: "const stamps = [1, 2, 3];",
    },
    {
      code: "function older(d: number): boolean { return d < 0; }",
    },
    {
      code: "function asString(): string { return ''; }",
    },
    {
      code: "class Job { name = 'job'; }",
    },
    {
      code: "type Pair = readonly [string, number];",
    },
    {
      code: "const handler = (n: number) => n + 1;",
    },
    {
      code: "declare const xs: ReadonlyArray<string>; const first = xs[0];",
    },
    {
      code: [
        "interface Api { getCount(): number }",
        "declare const api: Api;",
        "const count = api.getCount();",
      ].join("\n"),
    },
  ],
  invalid: [
    // Type-aware (inference-based) cases.
    {
      code: [
        "interface Api { getCreatedAt(): Date }",
        "declare const api: Api;",
        "const stamp = api.getCreatedAt();",
      ].join("\n"),
      // `noDateType` on the `: Date` annotation in the interface body, plus
      // `noDateTypeChecked` on the `stamp` binding.
      errors: [
        { messageId: "noDateType" },
        { messageId: "noDateTypeChecked" },
      ],
    },
    {
      code: [
        "interface Api { getCreatedAt(): Date }",
        "declare const api: Api;",
        "function older(d = api.getCreatedAt()) { return d.getTime(); }",
      ].join("\n"),
      errors: [
        { messageId: "noDateType" },
        { messageId: "noDateTypeChecked" },
      ],
    },
    {
      code: [
        "interface Row { createdAt: Date }",
        "declare const rows: Row[];",
        "const stamps = rows.map((r) => r.createdAt);",
      ].join("\n"),
      errors: [
        { messageId: "noDateType" },
        { messageId: "noDateTypeChecked" },
        { messageId: "noDateTypeChecked" },
      ],
    },
    {
      code: [
        "interface Api { getCreatedAt(): Date }",
        "declare const api: Api;",
        "class Job { createdAt = api.getCreatedAt(); }",
      ].join("\n"),
      errors: [
        { messageId: "noDateType" },
        { messageId: "noDateTypeChecked" },
      ],
    },
    {
      code: [
        "interface Api { getCreatedAt(): Date }",
        "declare const api: Api;",
        "function makeStamp() { return api.getCreatedAt(); }",
      ].join("\n"),
      errors: [
        { messageId: "noDateType" },
        { messageId: "noDateTypeChecked" },
      ],
    },
    {
      code: [
        "interface Api { getCreatedAt(): Date }",
        "declare const api: Api;",
        "const makeStamp = () => api.getCreatedAt();",
      ].join("\n"),
      errors: [
        { messageId: "noDateType" },
        { messageId: "noDateTypeChecked" },
      ],
    },
    {
      code: [
        "interface Api { getCreatedAt(): Date }",
        "declare const api: Api;",
        "type Pair = readonly [string, ReturnType<typeof api.getCreatedAt>];",
        "declare const pair: Pair;",
        "const second = pair[1];",
      ].join("\n"),
      errors: [
        { messageId: "noDateType" },
        { messageId: "noDateTypeChecked" },
        { messageId: "noDateTypeChecked" },
      ],
    },
    {
      code: [
        "interface Row { createdAt: Date }",
        "declare const row: Row;",
        "const { createdAt } = row;",
      ].join("\n"),
      errors: [
        { messageId: "noDateType" },
        { messageId: "noDateTypeChecked" },
      ],
    },
    {
      code: [
        "interface Api { maybeStamp(): Date | undefined }",
        "declare const api: Api;",
        "const stamp = api.maybeStamp();",
      ].join("\n"),
      errors: [
        { messageId: "noDateType" },
        { messageId: "noDateTypeChecked" },
      ],
    },
    // Pure syntactic cases — the type-checked rule must still catch them all.
    {
      code: "const stamp = new Date();",
      // The `new Date()` constructor (`noDateConstructor`) AND the binding's
      // inferred type `Date` (`noDateTypeChecked`).
      errors: [
        { messageId: "noDateTypeChecked" },
        { messageId: "noDateConstructor" },
      ],
    },
    {
      code: "const stamp = new Date('2024-01-01T00:00:00Z');",
      errors: [
        { messageId: "noDateTypeChecked" },
        { messageId: "noDateConstructor" },
      ],
    },
    {
      code: "const stamp = Date();",
      // `Date()` (without `new`) returns a `string`, so only the syntactic
      // `noDateConstructor` fires; the binding type is not `Date`.
      errors: [{ messageId: "noDateConstructor" }],
    },
    {
      code: "function consume(stamp: Date) { return stamp; }",
      // `noDateTypeChecked` for the inferred return type (reported on the
      // function declaration itself), `noDateTypeChecked` for the parameter
      // binding, and `noDateType` for the literal `: Date` annotation.
      errors: [
        { messageId: "noDateTypeChecked" },
        { messageId: "noDateTypeChecked" },
        { messageId: "noDateType" },
      ],
    },
    {
      code: "type Stamp = Date | null;",
      // `noDateType` for the `Date` type reference and `noNull`-equivalent is
      // covered by the `no-null-type-checked` rule, not this one.
      errors: [{ messageId: "noDateType" }],
    },
    {
      code: "const millis = Date.now();",
      errors: [{ messageId: "noDateNow" }],
    },
    {
      code: "if (Date.now() > deadline) { fail(); }",
      errors: [{ messageId: "noDateNow" }],
    },
  ],
});
