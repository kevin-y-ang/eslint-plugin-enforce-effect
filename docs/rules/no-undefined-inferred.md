# `no-undefined-inferred`

Disallow values whose inferred TypeScript type contains `undefined` in
favor of Effect-friendly absence models. This is the **type-aware**
companion to [`no-undefined`](./no-undefined.md): where `no-undefined`
matches the literal `undefined` identifier and the `TSUndefinedKeyword`
type in syntax, this rule asks the TypeScript type checker whether a
value's type is (or contains) `undefined`, and reports it even when no
`undefined` identifier or annotation appears at the use site.

This rule requires type information and ships under
`enforce-effect/recommended-type-checked` (not
`enforce-effect/recommended`), so users opt in once they're willing to
pay the type-checker cost.

## Why?

Effect-oriented codebases generally prefer absence to be modeled
explicitly with `Option` (or `Result` / `Effect` for cases where the
reason for absence matters). The syntactic
[`no-undefined`](./no-undefined.md) rule stops you from typing the word
`undefined`, but that alone leaks `undefined` whenever the type comes
from somewhere else:

```ts
const first = arr.find((p) => p.ok);    // inferred T | undefined
const cached = map.get(key);            // inferred V | undefined
function greet(name?: string) { /* ... */ } // name inferred string | undefined
const { admin } = config;               // admin inferred T | undefined
                                        //   when optional
```

The syntactic rule misses every line above (other than the optional
parameter `?`). This rule plugs that gap by checking the TypeScript
type at every value-bearing position.

## Scope: `undefined` only, not `void`

The predicate intentionally tests only `ts.TypeFlags.Undefined`, NOT
`ts.TypeFlags.Void`. A function whose return type is `void` (e.g.
`function noop(): void {}`) is NOT flagged, because flagging every
effectful side-effect function would be noise. This is a deliberate
design choice — see also the syntactic [`no-undefined`](./no-undefined.md)
rule, which makes the same trade-off by leaving `void` alone.

If you want to forbid `void` returns as well, layer
[`no-explicit-function-return-type`](./no-explicit-function-return-type.md)
or write a project-specific rule on top.

## How it works

The rule visits each value-bearing AST anchor and asks the TypeScript
type checker for the type at that position. It reports if the type is
`undefined` (i.e. has `ts.TypeFlags.Undefined`), or if it is a union,
intersection, array, or tuple that contains `undefined`.

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
`: T | undefined` annotation or a `?:` optional. The syntactic
[`no-undefined`](./no-undefined.md) rule still fires on the literal
`undefined` keyword; this rule additionally fires on the
inferred-or-annotated value position. Users running both rules should
expect overlapping reports — that is intentional and mirrors the
`prefer-readonly` /
`prefer-readonly-parameter-types` split in `typescript-eslint`.

## Replacement story

The replacements are the same as for [`no-undefined`](./no-undefined.md).
At a glance:

- Receiving an undefined-able from a third-party API or a missing object
  property? Convert at the boundary with `Option.fromUndefinedOr`
  (`.reference/effect/packages/effect/src/Option.ts` line 901) when only
  `undefined` means missing, or `Option.fromNullishOr`
  (`.reference/effect/packages/effect/src/Option.ts` line 863) when both
  `null` and `undefined` are missing sentinels.
- For domain values that should explain *why* something is missing, use
  `Result.Result<A, E>` (sync) or `Effect.Effect<A, E, R>`
  (async/effectful) and `Effect.fail` / `Result.fail` instead of
  returning `undefined`.
- For wire/JSON formats that already use `undefined` (or omitted keys),
  declare it at the schema boundary with `Schema.UndefinedOr`
  (`.reference/effect/packages/effect/src/Schema.ts` line 3609) or
  `Schema.NullishOr` (line 3629), and decode into a domain model whose
  type does not contain `undefined`.

For each replacement primitive, see the corresponding section in
[`no-undefined`](./no-undefined.md) — it has full vanilla-vs-Effect
side-by-side examples for `Option.fromNullishOr`, `Option.fromUndefinedOr`,
`Result`, `Effect`, `Schema.Option`, `Schema.NullOr`, `Schema.UndefinedOr`,
and `Schema.NullishOr`.

## Examples

### Inferred from `Array.prototype.find`

Vanilla:

```ts
declare const arr: number[];
const first = arr.find((n) => n > 0); // inferred number | undefined — flagged
```

Effect:

```ts
import { Option } from "effect";

declare const arr: number[];
const first = Option.fromUndefinedOr(arr.find((n) => n > 0));
```

### Inferred from `Map.prototype.get`

Vanilla:

```ts
declare const map: Map<string, number>;
const value = map.get("k"); // inferred number | undefined — flagged
```

Effect:

```ts
import { Option } from "effect";

declare const map: Map<string, number>;
const value = Option.fromUndefinedOr(map.get("k"));
```

### Inferred via optional parameter

Vanilla:

```ts
function greet(name?: string) {
  return name; // name inferred string | undefined — flagged
}
```

Effect:

```ts
import { Option } from "effect";

const greet = (name: Option.Option<string>) => name;
```

### Inferred via destructuring of optional property

Vanilla:

```ts
interface Config {
  admin?: { id: string };
}
declare const config: Config;
const { admin } = config; // admin inferred { id: string } | undefined — flagged
```

Effect:

```ts
import { Option } from "effect";

interface Config {
  admin?: { id: string };
}
declare const config: Config;
const admin = Option.fromUndefinedOr(config.admin);
```

### Hidden inside `ReturnType`

Vanilla:

```ts
type Pair = readonly [string, ReturnType<typeof api.maybeUser>];

declare const pair: Pair;
const second = pair[1]; // inferred User | undefined — flagged
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
meaningfully more expensive than the syntactic
[`no-undefined`](./no-undefined.md). If you cannot afford type-aware
linting in your editor or CI, leave this rule disabled and rely on
`no-undefined` alone.

## Disabling

If a particular value genuinely needs to remain `T | undefined`,
disable the rule inline with a justification (the project's
`require-lint-disable-justification` rule enforces this):

```ts
// eslint-disable-next-line no-undefined-inferred -- third-party callback signature
//   gives us `T | undefined` synchronously and we wrap it in Option immediately.
const raw = thirdParty.findFirst(predicate);
const opt = Option.fromUndefinedOr(raw);
```

## Related rules

- [`no-undefined`](./no-undefined.md) — the syntactic companion that
  bans the literal `undefined` identifier and the `undefined` type
  keyword at the source level.
- [`no-null-inferred`](./no-null-inferred.md) — the parallel rule for
  `null`.
