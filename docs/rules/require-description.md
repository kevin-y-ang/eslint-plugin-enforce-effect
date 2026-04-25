# `require-description`

Require a description in every ESLint directive comment so it is clear *why* the directive is necessary.

A directive comment such as `// eslint-disable-next-line foo` mutes a lint error but communicates nothing about the reason. Future readers (and you, six months from now) cannot tell whether the suppression is a temporary workaround, a deliberate exception, or a forgotten chunk of debug code. Requiring a `-- reason` description forces the suppression to be self-documenting and reviewable.

This rule is ported from [`@eslint-community/eslint-plugin-eslint-comments/require-description`](https://eslint-community.github.io/eslint-plugin-eslint-comments/rules/require-description.html).

## Examples

Examples of **incorrect** code:

```ts
/* eslint no-undef: off */
/* eslint-disable eqeqeq */
/* eslint-enable eqeqeq */
// eslint-disable-line
// eslint-disable-next-line eqeqeq
/* exported foo */
/* global $ */
/* globals a, b, c */
```

Examples of **correct** code:

```ts
/* eslint no-undef: off -- legacy module attaches to globals during bootstrap */
/* eslint-disable eqeqeq -- third-party API uses loose equality semantics */
/* eslint-enable eqeqeq -- restore strict equality after the legacy block */
// eslint-disable-next-line eqeqeq -- comparing nullish values, intentional
/* global $ -- this script depends on jQuery loaded via <script> tag */
```

The description text is anything that follows ` -- ` (whitespace, two or more hyphens, whitespace) inside the comment.

## Options

```jsonc
{
  "enforce-effect/require-description": [
    "error",
    {
      "ignore": [],
      "minLength": 0,
      "maxLength": 280
    }
  ]
}
```

- `ignore` – an array of directive kinds to skip. Useful when you want to enforce descriptions on most directive comments but tolerate one specific kind. Allowed values:
  - `"eslint"`
  - `"eslint-disable"`
  - `"eslint-disable-line"`
  - `"eslint-disable-next-line"`
  - `"eslint-enable"`
  - `"eslint-env"`
  - `"exported"`
  - `"global"`
  - `"globals"`
- `minLength` – minimum character count (after trimming) for a description. Defaults to `0`. A description shorter than this fires `descriptionTooShort` instead of `missingDescription`. Note: a directive with no `--` separator at all, or with a `--` followed by whitespace only, always fires `missingDescription` regardless of `minLength`.
- `maxLength` – maximum character count for a description. Defaults to no limit. A description longer than this fires `descriptionTooLong`. Useful for keeping inline justifications terse (long-form rationale belongs in commit messages or docs).

`minLength` and `maxLength` are checked independently of `ignore`: directive kinds listed in `ignore` are skipped entirely.

> **Granularity caveat:** `ignore` filters by *directive kind* (the keyword like `eslint-disable-next-line`), not by the *lint rule(s) named in the directive*. If you need to require descriptions only when disabling certain rules (e.g. always require a justification for `no-type-assertion` disables but allow bare `no-console` disables), this rule does not currently support that.

## When Not To Use It

If your team does not use ESLint inline directive comments, or you do not want to enforce justifications, you can leave this rule disabled.
