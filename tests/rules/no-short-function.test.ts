import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-short-function.js";

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

ruleTester.run("no-short-function", rule, {
  valid: [
    {
      // Used twice -> not a single-use helper.
      code: [
        "function double(n: number) {",
        "  return n * 2;",
        "}",
        "double(1);",
        "double(2);",
      ].join("\n"),
    },
    {
      // Body has three lines between the brackets -> default minBodyLines: 3 doesn't fire.
      code: [
        "function summarize(n: number) {",
        "  const doubled = n * 2;",
        "  const tripled = n * 3;",
        "  return doubled + tripled;",
        "}",
        "summarize(1);",
      ].join("\n"),
    },
    {
      // Exported short helper used once locally -> public surface, skip.
      code: [
        "export function double(n: number) {",
        "  return n * 2;",
        "}",
        "double(1);",
      ].join("\n"),
    },
    {
      // Re-exported short helper used once locally -> skip.
      code: [
        "function double(n: number) {",
        "  return n * 2;",
        "}",
        "double(1);",
        "export { double };",
      ].join("\n"),
    },
    {
      // `export default` of a named function declaration -> public surface, skip.
      code: [
        "function double(n: number) {",
        "  return n * 2;",
        "}",
        "double(1);",
        "export default double;",
      ].join("\n"),
    },
    {
      // Recursive helper -> not trivially inlinable.
      code: [
        "function fact(n: number): number {",
        "  return n <= 1 ? 1 : n * fact(n - 1);",
        "}",
        "fact(5);",
      ].join("\n"),
    },
    {
      // Reassigned binding -> skip (rule can't tell which assignment is "the" function).
      code: [
        "let handler = (event: string) => event.length;",
        "handler = (event: string) => event.trim().length;",
        "handler('x');",
      ].join("\n"),
    },
    {
      // Unused -> not "referenced one other time"; let no-unused-vars handle it.
      code: [
        "function unused(n: number) {",
        "  return n * 2;",
        "}",
      ].join("\n"),
    },
    {
      // Object methods are out of scope (no named binding to track).
      code: [
        "const service = {",
        "  double(n: number) { return n * 2; },",
        "};",
        "service.double(1);",
      ].join("\n"),
    },
    {
      // Used twice but minReferences default of 2 -> 2 references are enough to escape the rule.
      code: [
        "function double(n: number) {",
        "  return n * 2;",
        "}",
        "double(1);",
        "double(2);",
      ].join("\n"),
      options: [{ minReferences: 2 }],
    },
    {
      // Body has three lines and minBodyLines is 3 -> threshold met, rule doesn't fire.
      code: [
        "function summarize(n: number) {",
        "  const doubled = n * 2;",
        "  const tripled = n * 3;",
        "  return doubled + tripled;",
        "}",
        "summarize(1);",
      ].join("\n"),
      options: [{ minBodyLines: 3 }],
    },
    {
      // minBodyLines: 1 -> only fully empty (zero-line) bodies trigger.
      code: [
        "function double(n: number) {",
        "  return n * 2;",
        "}",
        "double(1);",
      ].join("\n"),
      options: [{ minBodyLines: 1 }],
    },
    {
      // allowBracelessArrowFunctions: true -> concise arrow body is whitelisted.
      code: [
        "const double = (n: number) => n * 2;",
        "double(1);",
      ].join("\n"),
      options: [{ allowBracelessArrowFunctions: true }],
    },
  ],
  invalid: [
    {
      // Single-line block body, used once.
      code: [
        "function double(n: number) {",
        "  return n * 2;",
        "}",
        "double(1);",
      ].join("\n"),
      errors: [{ messageId: "noShortFunction", data: { name: "double" } }],
    },
    {
      // Two-line block body, used once.
      code: [
        "const greet = (name: string) => {",
        "  const trimmed = name.trim();",
        "  return `hello ${trimmed}`;",
        "};",
        "greet('world');",
      ].join("\n"),
      errors: [{ messageId: "noShortFunction", data: { name: "greet" } }],
    },
    {
      // Concise arrow expression body, used once.
      code: [
        "const double = (n: number) => n * 2;",
        "double(1);",
      ].join("\n"),
      errors: [{ messageId: "noShortFunction", data: { name: "double" } }],
    },
    {
      // Function expression assigned to const, used once.
      code: [
        "const double = function (n: number) {",
        "  return n * 2;",
        "};",
        "double(1);",
      ].join("\n"),
      errors: [{ messageId: "noShortFunction", data: { name: "double" } }],
    },
    {
      // Used as a callback once.
      code: [
        "const items: number[] = [1, 2, 3];",
        "const double = (n: number) => n * 2;",
        "items.map(double);",
      ].join("\n"),
      errors: [{ messageId: "noShortFunction", data: { name: "double" } }],
    },
    {
      // minReferences: 3 -> a short helper used twice is now flagged.
      code: [
        "function double(n: number) {",
        "  return n * 2;",
        "}",
        "double(1);",
        "double(2);",
      ].join("\n"),
      options: [{ minReferences: 3 }],
      errors: [{ messageId: "noShortFunction", data: { name: "double" } }],
    },
    {
      // minBodyLines: 5 -> a 4-line body is now considered short.
      code: [
        "function summarize(n: number) {",
        "  const doubled = n * 2;",
        "  const tripled = n * 3;",
        "  const quadrupled = n * 4;",
        "  return doubled + tripled + quadrupled;",
        "}",
        "summarize(1);",
      ].join("\n"),
      options: [{ minBodyLines: 5 }],
      errors: [{ messageId: "noShortFunction", data: { name: "summarize" } }],
    },
    {
      // Combined: minBodyLines + minReferences both raised.
      code: [
        "const triple = (n: number) => {",
        "  const doubled = n * 2;",
        "  const halved = n / 2;",
        "  const sum = doubled + halved;",
        "  return sum;",
        "};",
        "triple(1);",
        "triple(2);",
      ].join("\n"),
      options: [{ minBodyLines: 5, minReferences: 3 }],
      errors: [{ messageId: "noShortFunction", data: { name: "triple" } }],
    },
    {
      // allowBracelessArrowFunctions: true does NOT exempt block-bodied arrows.
      code: [
        "const double = (n: number) => {",
        "  return n * 2;",
        "};",
        "double(1);",
      ].join("\n"),
      options: [{ allowBracelessArrowFunctions: true }],
      errors: [{ messageId: "noShortFunction", data: { name: "double" } }],
    },
    {
      // Explicit allowBracelessArrowFunctions: false matches default behavior.
      code: [
        "const double = (n: number) => n * 2;",
        "double(1);",
      ].join("\n"),
      options: [{ allowBracelessArrowFunctions: false }],
      errors: [{ messageId: "noShortFunction", data: { name: "double" } }],
    },
  ],
});
