import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import requireDescription from "../../src/rules/ban-vanilla/require-description.js";

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
  // The samples below contain literal `eslint-disable*` comments that we want to
  // exercise as inputs to this rule. We disable ESLint's own checks so they
  // don't show up as additional reports during testing.
  linterOptions: {
    reportUnusedDisableDirectives: false,
    reportUnusedInlineConfigs: "off",
  },
});

ruleTester.run("require-description", requireDescription, {
  valid: [
    { code: '/* eslint eqeqeq: "off", curly: "error" -- explanation */' },
    { code: "/* eslint-disable -- description */" },
    { code: "/* eslint-enable -- description */" },
    { code: "/* exported -- description */" },
    { code: "/* global -- description */" },
    { code: "/* globals -- description */" },
    { code: "/* just eslint in a normal comment */" },
    { code: "// eslint-disable-line -- description" },
    { code: "// eslint-disable-next-line -- description" },
    { code: "// eslint-disable-line eqeqeq -- description" },
    { code: "// eslint-disable-next-line eqeqeq -- description" },
    {
      code: "/* eslint */",
      options: [{ ignore: ["eslint"] }],
    },
    {
      code: "/* eslint-enable */",
      options: [{ ignore: ["eslint-enable"] }],
    },
    {
      code: "/* eslint-disable */",
      options: [{ ignore: ["eslint-disable"] }],
    },
    {
      code: "// eslint-disable-line",
      options: [{ ignore: ["eslint-disable-line"] }],
    },
    {
      code: "// eslint-disable-next-line",
      options: [{ ignore: ["eslint-disable-next-line"] }],
    },
    {
      code: "/* exported */",
      options: [{ ignore: ["exported"] }],
    },
    {
      code: "/* global */",
      options: [{ ignore: ["global"] }],
    },
    {
      code: "/* globals */",
      options: [{ ignore: ["globals"] }],
    },
    {
      code: "// eslint-disable-next-line eqeqeq -- ok",
      options: [{ minLength: 2 }],
    },
    {
      code: "// eslint-disable-next-line eqeqeq -- short",
      options: [{ maxLength: 5 }],
    },
    {
      code: "// eslint-disable-next-line eqeqeq -- exactly five",
      options: [{ minLength: 12, maxLength: 12 }],
    },
  ],
  invalid: [
    {
      code: "/* eslint */",
      errors: [{ messageId: "missingDescription" }],
    },
    {
      code: '/* eslint eqeqeq: "off", curly: "error" */',
      errors: [{ messageId: "missingDescription" }],
    },
    {
      code: "/* eslint-enable */",
      errors: [{ messageId: "missingDescription" }],
    },
    {
      code: "/* eslint-enable eqeqeq */",
      errors: [{ messageId: "missingDescription" }],
    },
    {
      code: "/* eslint-disable */",
      errors: [{ messageId: "missingDescription" }],
    },
    {
      code: "/* eslint-disable eqeqeq */",
      errors: [{ messageId: "missingDescription" }],
    },
    {
      code: "// eslint-disable-line",
      errors: [{ messageId: "missingDescription" }],
    },
    {
      code: "// eslint-disable-line eqeqeq",
      errors: [{ messageId: "missingDescription" }],
    },
    {
      code: "// eslint-disable-next-line",
      errors: [{ messageId: "missingDescription" }],
    },
    {
      code: "// eslint-disable-next-line eqeqeq",
      errors: [{ messageId: "missingDescription" }],
    },
    {
      code: "/* exported */",
      errors: [{ messageId: "missingDescription" }],
    },
    {
      code: "/* global */",
      errors: [{ messageId: "missingDescription" }],
    },
    {
      code: "/* global _ */",
      errors: [{ messageId: "missingDescription" }],
    },
    {
      code: "/* globals */",
      errors: [{ messageId: "missingDescription" }],
    },
    {
      code: "/* globals _ */",
      errors: [{ messageId: "missingDescription" }],
    },
    {
      code: "// eslint-disable-next-line eqeqeq -- ",
      errors: [{ messageId: "missingDescription" }],
    },
    {
      code: "// eslint-disable-next-line eqeqeq -- ok",
      options: [{ minLength: 10 }],
      errors: [{ messageId: "descriptionTooShort" }],
    },
    {
      code: "// eslint-disable-next-line eqeqeq -- this description is far too long for the budget",
      options: [{ maxLength: 20 }],
      errors: [{ messageId: "descriptionTooLong" }],
    },
    {
      code: "// eslint-disable-next-line eqeqeq -- short",
      options: [{ minLength: 10, maxLength: 30 }],
      errors: [{ messageId: "descriptionTooShort" }],
    },
  ],
});
