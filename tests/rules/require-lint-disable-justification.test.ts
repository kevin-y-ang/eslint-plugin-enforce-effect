import parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import requireLintDisableJustification from "../../src/rules/ban-vanilla/require-lint-disable-justification.js";

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

ruleTester.run("require-lint-disable-justification", requireLintDisableJustification, {
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

    // ignoreRules: array — directive naming only an ignored rule is exempt
    {
      code: "// eslint-disable-next-line no-console",
      options: [{ ignoreRules: ["no-console"] }],
    },
    // ignoreRules: array — multi-rule directive where ALL named rules are ignored
    {
      code: "/* eslint-disable no-console, no-debugger */",
      options: [{ ignoreRules: ["no-console", "no-debugger"] }],
    },
    // ignoreRules: regex — pattern-matched rule is exempt
    {
      code: "// eslint-disable-next-line no-console",
      options: [{ ignoreRules: "^no-console$" }],
    },
    // ignoreRules: regex — pattern matches anywhere in the directive body
    {
      code: "/* eslint-disable no-console, no-debugger */",
      options: [{ ignoreRules: "no-(console|debugger)" }],
    },
    // ignoreRules: applies to `eslint` config-form too
    {
      code: '/* eslint no-console: "off" */',
      options: [{ ignoreRules: ["no-console"] }],
    },

    // requireRules: array — directive names a rule NOT in the require list, exempt
    {
      code: "// eslint-disable-next-line no-console",
      options: [{ requireRules: ["eqeqeq"] }],
    },
    // requireRules: regex — directive names a rule that doesn't match, exempt
    {
      code: "// eslint-disable-next-line no-console",
      options: [{ requireRules: "^prefer-" }],
    },
    // ignore option still beats rule filtering — bare disable on an ignored kind
    {
      code: "/* eslint-disable */",
      options: [{ ignore: ["eslint-disable"], requireRules: ["eqeqeq"] }],
    },
    // ignoreRules + requireRules combined — ignored rule isn't in requireRules,
    // and ignoreRules takes precedence
    {
      code: "/* eslint-disable no-console, no-debugger */",
      options: [
        { ignoreRules: ["no-console"], requireRules: ["eqeqeq"] },
      ],
    },
    // ignoreRules takes precedence over requireRules when both match
    {
      code: "// eslint-disable-next-line no-console",
      options: [
        { ignoreRules: ["no-console"], requireRules: ["no-console"] },
      ],
    },
    // ignoreRules: multi-rule directive where ANY ignored rule matches is exempt.
    // (Less strict than parsing the full rule list; a directive that mentions an
    // ignored rule alongside a non-ignored one is still considered exempt.)
    {
      code: "/* eslint-disable no-console, no-debugger */",
      options: [{ ignoreRules: ["no-console"] }],
    },
    // ignoreRules + requireRules combined — body mentions an ignored rule, so
    // ignoreRules wins even though another rule matches requireRules
    {
      code: "/* eslint-disable no-console, eqeqeq */",
      options: [
        { ignoreRules: ["no-console"], requireRules: ["eqeqeq"] },
      ],
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

    // ignoreRules: directive names a rule NOT in the ignore list, still required
    {
      code: "// eslint-disable-next-line no-debugger",
      options: [{ ignoreRules: ["no-console"] }],
      errors: [{ messageId: "missingDescription" }],
    },
    // ignoreRules: bare disable applies to everything; cannot be filtered out
    {
      code: "/* eslint-disable */",
      options: [{ ignoreRules: ["no-console"] }],
      errors: [{ messageId: "missingDescription" }],
    },
    // ignoreRules: bare disable still required even with regex
    {
      code: "/* eslint-disable */",
      options: [{ ignoreRules: ".*" }],
      errors: [{ messageId: "missingDescription" }],
    },
    // ignoreRules: prefix doesn't false-positive against a longer rule name
    // (boundary check distinguishes "no-undef" from "no-undef-init").
    {
      code: "// eslint-disable-next-line no-undef-init",
      options: [{ ignoreRules: ["no-undef"] }],
      errors: [{ messageId: "missingDescription" }],
    },

    // requireRules: directive names a matching rule, description required
    {
      code: "// eslint-disable-next-line eqeqeq",
      options: [{ requireRules: ["eqeqeq"] }],
      errors: [{ messageId: "missingDescription" }],
    },
    // requireRules: regex match
    {
      code: "// eslint-disable-next-line eqeqeq",
      options: [{ requireRules: "^eq" }],
      errors: [{ messageId: "missingDescription" }],
    },
    // requireRules: bare disable applies to everything (incl. required rules)
    {
      code: "/* eslint-disable */",
      options: [{ requireRules: ["eqeqeq"] }],
      errors: [{ messageId: "missingDescription" }],
    },
    // requireRules: multi-rule — at least one matching rule triggers requirement
    {
      code: "/* eslint-disable no-console, eqeqeq */",
      options: [{ requireRules: ["eqeqeq"] }],
      errors: [{ messageId: "missingDescription" }],
    },
    // requireRules combines with length checks
    {
      code: "// eslint-disable-next-line eqeqeq -- ok",
      options: [{ requireRules: ["eqeqeq"], minLength: 20 }],
      errors: [{ messageId: "descriptionTooShort" }],
    },
    // `eslint` config-form directive — keys are rule names
    {
      code: '/* eslint eqeqeq: "off" */',
      options: [{ requireRules: ["eqeqeq"] }],
      errors: [{ messageId: "missingDescription" }],
    },
  ],
});
