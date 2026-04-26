# `no-null-inferred`

Disallow values whose inferred TypeScript type contains `null` in
favor of Effect-friendly absence models. This is the **type-aware**
companion to [`no-null`](./no-null.md): where `no-null` matches the
literal `null` keyword (both the `Literal` value and the `TSNullKeyword`
type) in syntax, this rule asks the TypeScript type checker whether a
value's type is (or contains) `null`, and reports it even when no
`null` literal or annotation appears at the use site.

This rule requires type information and ships under
`enforce-effect/recommended-type-checked` (not
`enforce-effect/recommended`), so users opt in once they're willing to
pay the type-checker cost.

## Why?

Effect-oriented codebases generally prefer absence to be modeled
explicitly with `Option` (or `Result` / `Effect` for cases where the
reason for absence matters). The syntactic [`no-null`](./no-null.md)
rule stops you from typing the word `null`, but that alone leaks `null`
whenever the type comes from somewhere else:

```ts
const found = users.findFirst(...);     // inferred T | null
const ref = inputRef.current;           // inferred T | null
function head<T>(xs: T[]): T | null { /* ... */ }
const h = head([1, 2, 3]);              // inferred number | null
```

The syntactic rule misses every line above (other than the `null` in
the explicit return annotation of `head`). This rule plugs that gap by
checking the TypeScript type at every value-bearing position.

## How it works

The rule visits each value-bearing AST anchor and asks the TypeScript
type checker for the type at that position. It reports if the type is
`null` (i.e. has `ts.TypeFlags.Null`), or if it is a union,
intersection, array, or tuple that contains `null`.

Anchors checked:

- `VariableDeclarator` — every binding identifier produced by the
  declared pattern (including destructuring).
- `PropertyDefinition` — class fields.
- Function parameters — for `FunctionDeclaration`, `FunctionExpression`,
  and `ArrowFunctionExpression`, every binding identifier across the
  parameter pattern (including default values, destructuring, rest, and
  constructor `TSParameterProperty`).
- Function return type — the inferred return type of the same
  function-like nodes.

The rule deliberately does **not** skip nodes that already have a
`: T | null` annotation. The syntactic [`no-null`](./no-null.md) rule
still fires on the literal `null` keyword; this rule additionally fires
on the inferred-or-annotated value position. Users running both rules
should expect overlapping reports — that is intentional and mirrors the
`prefer-readonly` /
`prefer-readonly-parameter-types` split in `typescript-eslint`.

## Replacement story

The replacements are the same as for [`no-null`](./no-null.md). At a
glance:

- Receiving a nullable from a third-party API or JSON deserialization?
  Convert at the boundary with `Option.fromNullOr`
  (`.reference/effect/packages/effect/src/Option.ts` line 939) when
  only `null` means missing, or `Option.fromNullishOr`
  (`.reference/effect/packages/effect/src/Option.ts` line 863) when
  both `null` and `undefined` are missing sentinels.
- For domain values that should explain *why* something is missing,
  use `Result.Result<A, E>` (sync) or `Effect.Effect<A, E, R>`
  (async/effectful) and `Effect.fail` / `Result.fail` instead of
  returning `null`.
- For wire/JSON formats that already use `null`, declare it at the
  schema boundary with `Schema.NullOr`
  (`.reference/effect/packages/effect/src/Schema.ts` line 3587) or
  `Schema.NullishOr` (line 3629), and decode into a domain model whose
  type does not contain `null`.

For each replacement primitive, see the corresponding section in
[`no-null`](./no-null.md) — it has full vanilla-vs-Effect side-by-side
examples for `Option.fromNullishOr`, `Option.fromNullOr`, `Result`,
`Effect`, `Schema.Option`, `Schema.NullOr`, `Schema.UndefinedOr`, and
`Schema.NullishOr`.

## Examples

### Inferred from a third-party return type

Vanilla:

```ts
import { users } from "third-party";

const found = users.findFirst({ id: "u1" }); // inferred User | null — flagged
```

Effect:

```ts
import { users } from "third-party";
import { Option } from "effect";

const found = Option.fromNullOr(users.findFirst({ id: "u1" }));
```

### Inferred via DOM ref (`current`)

Vanilla:

```ts
declare const inputRef: { current: HTMLInputElement | null };
const ref = inputRef.current; // inferred HTMLInputElement | null — flagged
```

Effect:

```ts
import { Option } from "effect";

declare const inputRef: { current: HTMLInputElement | null };
const ref = Option.fromNullOr(inputRef.current);
```

### Inferred via callback contextual typing

Vanilla:

```ts
interface Row {
  label: string | null;
}
declare const rows: Row[];

const labels = rows.map((r) => r.label); // (string | null)[] — flagged
```

Effect:

```ts
import { Option } from "effect";

interface Row {
  label: string | null;
}
declare const rows: Row[];

const labels = rows.map((r) => Option.fromNullOr(r.label));
```

### Inferred function return type

Vanilla:

```ts
function head<T>(xs: T[]): T | null {
  return xs.length > 0 ? (xs[0] as T) : null;
}

const h = head([1, 2, 3]); // inferred number | null — flagged
```

Effect:

```ts
import { Option } from "effect";

function head<T>(xs: T[]): Option.Option<T> {
  return xs.length > 0 ? Option.some(xs[0] as T) : Option.none();
}

const h = head([1, 2, 3]);
```

### Hidden inside `ReturnType`

Vanilla:

```ts
type Pair = readonly [string, ReturnType<typeof api.findUser>];

declare const pair: Pair;
const second = pair[1]; // inferred User | null — flagged
```

Effect:

```ts
import { Option } from "effect";

type Pair = readonly [string, Option.Option<User>];

declare const pair: Pair;
const second = pair[1];
```

## When not to use it

This rule requires type information and depends on
`parserOptions.project` (or `projectService`) being configured. It is
meaningfully more expensive than the syntactic [`no-null`](./no-null.md).
If you cannot afford type-aware linting in your editor or CI, leave
this rule disabled and rely on `no-null` alone.

## Disabling

If a particular value genuinely needs to remain `T | null`, disable
the rule inline with a justification (the project's
`require-lint-disable-justification` rule enforces this):

```ts
// eslint-disable-next-line no-null-inferred -- DOM ref is null until React mounts;
//   we hand it straight to Option.fromNullOr on the very next line.
const ref = inputRef.current;
const opt = Option.fromNullOr(ref);
```

## Related rules

- [`no-null`](./no-null.md) — the syntactic companion that bans the
  literal `null` value and the `null` type keyword at the source level.
- [`no-undefined-inferred`](./no-undefined-inferred.md) — the parallel
  rule for `undefined`.
