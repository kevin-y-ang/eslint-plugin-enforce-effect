# `no-short-function`

Disallow short, rarely-referenced named functions in favor of inlining them at
the call site.

## Why?

A named function pays its weight when it is reused, recursive, exported, or
long enough that a name aids comprehension. A short helper that is only ever
called once does the opposite: the reader has to jump to the definition,
re-establish the parameter binding, and walk the body, only to discover a
one- or two-line expression. Inlining the body removes the indirection and
keeps the logic at its single point of use.

This rule fires when **all** of the following hold:

- The function is declared as `function foo() {}`, `const foo = () => {}`,
  or `const foo = function () {}`.
- The function body has fewer than `minBodyLines` lines between the braces
  (concise arrow expression bodies always count as zero lines).
- The function has at least one reference but fewer than `minReferences`
  references in the same file (excluding self-references inside its own
  body).
- The binding is not exported, re-exported, re-assigned, or self-referential.

## Options

```ts
type Options = [
  {
    /** Default: 3. A function escapes the rule when its body has at least this many lines between braces. */
    minBodyLines?: number;
    /** Default: 2. A function escapes the rule when it is referenced at least this many times in the file. */
    minReferences?: number;
    /** Default: false. When true, arrow functions with a concise (braceless) expression body — e.g. `(x) => x * 2` — are skipped entirely. */
    allowBracelessArrowFunctions?: boolean;
  },
];
```

### `minBodyLines`

Minimum number of lines between the function body's braces required for a
function to escape this rule. Bodies with strictly fewer lines are flagged.
Defaults to `3`, which matches the original "fewer than three lines long
between the brackets" specification. Concise arrow expression bodies (e.g.
`(x) => x * 2`) always count as zero lines.

```jsonc
{
  "rules": {
    "enforce-effect/no-short-function": ["error", { "minBodyLines": 5 }]
  }
}
```

### `minReferences`

Minimum number of references to the function (outside its own body) required
for a function to escape this rule. Defaults to `2` — i.e., a function with
exactly one external reference is flagged. Raise it to also flag short
helpers that are used twice, three times, etc.

```jsonc
{
  "rules": {
    "enforce-effect/no-short-function": ["error", { "minReferences": 3 }]
  }
}
```

### `allowBracelessArrowFunctions`

When `true`, arrow functions with a concise (braceless) expression body —
e.g. `(x) => x * 2` — are skipped entirely. Their expression body already
reads roughly the way an inlined call would, so a forced inlining buys
little. Defaults to `false`, meaning braceless arrows are subject to the
same `minBodyLines` / `minReferences` thresholds as block-bodied functions.

```jsonc
{
  "rules": {
    "enforce-effect/no-short-function": [
      "error",
      { "allowBracelessArrowFunctions": true }
    ]
  }
}
```

The option only affects `ArrowFunctionExpression` with a non-block body;
arrow functions written with `{ ... }` braces are still checked against
`minBodyLines`.

## Examples

Examples of **incorrect** code for this rule (default options):

```ts
function double(n: number) {
  return n * 2;
}

double(1);
```

```ts
const greet = (name: string) => {
  const trimmed = name.trim();
  return `hello ${trimmed}`;
};

greet("world");
```

```ts
const items = [1, 2, 3];
const double = (n: number) => n * 2;
items.map(double);
```

Examples of **correct** code for this rule (default options):

```ts
double(1);
double(2);

function double(n: number) {
  return n * 2;
}
```

```ts
function summarize(n: number) {
  const doubled = n * 2;
  const tripled = n * 3;
  return doubled + tripled;
}

summarize(1);
```

```ts
const items = [1, 2, 3];
items.map((n) => n * 2);
```

## When not to use

- The helper exists primarily for readability of the call site (e.g., a
  domain-meaningful name like `isAdult` reads better than the inlined
  expression).
- The helper is exported or referenced from outside the file. The rule
  already skips these cases automatically; disable inline if you have a
  pattern this rule cannot detect.
