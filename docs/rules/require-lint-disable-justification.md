# `require-lint-disable-justification`

Require a description in every ESLint directive comment so it is clear *why* the directive is necessary.

A directive comment such as `// eslint-disable-next-line foo` mutes a lint error but communicates nothing about the reason. Future readers (and you, six months from now) cannot tell whether the suppression is a temporary workaround, a deliberate exception, or a forgotten chunk of debug code. Requiring a `-- reason` description forces the suppression to be self-documenting and reviewable.

This rule is ported from [`@eslint-community/eslint-plugin-eslint-comments/require-lint-disable-justification`](https://eslint-community.github.io/eslint-plugin-eslint-comments/rules/require-lint-disable-justification.html).

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
  "enforce-effect/require-lint-disable-justification": [
    "error",
    {
      "ignore": [],
      "minLength": 0,
      "maxLength": 280,
      "ignoreRules": [],
      "requireRules": []
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
- `ignoreRules` – `string[]` (exact rule names) or `string` (regex pattern). If the directive body mentions any of these rules, the directive is exempt from the description requirement.
- `requireRules` – `string[]` (exact rule names) or `string` (regex pattern). When set, descriptions are required only for directives whose body mentions at least one matching rule, plus all bare directives (which apply to every rule, including ones in this list).

`minLength` and `maxLength` are checked independently of `ignore`: directive kinds listed in `ignore` are skipped entirely.

When both `ignoreRules` and `requireRules` are set and both match the body, **`ignoreRules` wins** — if you marked a rule as ignorable, mentioning it makes the directive exempt even if other rules in the same directive would have triggered `requireRules`.

### Matching semantics

Rule matching runs against the *body text* of the directive (the part between the directive keyword and any `--` description), not against a parsed rule list:

- **Array form** (`["foo", "bar"]`): each name is matched with a non-rule-name boundary, so `"no-console"` will not false-positive against `no-console-log`. Punctuation that appears around rule names in real directive comments (whitespace, commas, colons, quotes, brackets) is treated as a boundary.
- **Regex form** (`"^enforce-effect/"`): your pattern is tested against the whole body verbatim. Don't anchor with `^`/`$` if you want to match a rule that appears partway through a comma-separated list.

Bare directives like `/* eslint-disable */` have no body and so cannot match either filter — they always require a description (subject only to the `ignore` option).

A directive that mentions multiple rules (e.g. `/* eslint-disable foo, bar */`) is treated as a single unit. Mentioning even one ignored rule makes the whole directive exempt; mentioning even one required rule makes the whole directive required.

### Examples

Require descriptions only when disabling specific high-stakes rules:

```jsonc
{
  "enforce-effect/require-lint-disable-justification": [
    "error",
    { "requireRules": ["no-type-assertion", "enforce-effect/no-effect-ignore"] }
  ]
}
```

Require descriptions for any rule in your plugin namespace (regex form):

```jsonc
{
  "enforce-effect/require-lint-disable-justification": [
    "error",
    { "requireRules": "^enforce-effect/" }
  ]
}
```

Require descriptions for everything *except* a known-safe shortlist:

```jsonc
{
  "enforce-effect/require-lint-disable-justification": [
    "error",
    { "ignoreRules": ["no-console", "no-debugger"] }
  ]
}
```

## When Not To Use It

If your team does not use ESLint inline directive comments, or you do not want to enforce justifications, you can leave this rule disabled.
