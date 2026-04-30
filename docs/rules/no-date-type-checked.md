# `no-date-type-checked`

Strict type-aware **superset** of [`no-date`](./no-date.md): in addition to
flagging every syntactic violation that `no-date` flags (the literal `Date`
constructor, `Date()`, `Date.now()`, and `Date` type references), this rule
also asks the TypeScript type checker whether a value's type is (or contains)
the global JS `Date` and reports it even when no `Date` identifier appears at
the use site.

Use this rule **instead of** [`no-date`](./no-date.md), not alongside it.
Because `no-date-type-checked` reports a strict superset of what `no-date`
reports, enabling both would produce duplicate reports on every syntactic
violation. Pick one based on whether you can afford type-aware linting:

- `enforce-effect/recommended` enables `no-date` (cheap, syntactic only).
- `enforce-effect/recommended-type-checked` enables `no-date-type-checked` and
  drops `no-date` from the same config.

## Why?

Effect-oriented codebases prefer `DateTime` (and `Clock` for raw timestamps)
over the ambient `Date` constructor and the built-in `Date` interface. The
syntactic [`no-date`](./no-date.md) rule stops you from typing the word
`Date`, but that alone leaks `Date` whenever the type comes from somewhere
else:

```ts
import { someApi } from "third-party";

const stamp = someApi.getCreatedAt();             // inferred Date
function older(d) { return d < cutoff; }          // d inferred Date via contextual typing
const stamps = rows.map((r) => r.createdAt);      // Date[]
class Job { createdAt = someApi.getCreatedAt(); } // class field type inferred Date
type Pair = readonly [string, ReturnType<typeof someApi.getCreatedAt>]; // Date hidden
```

The syntactic rule misses every line above because the literal identifier
`Date` never appears in the user's source. This rule plugs that gap by
checking the TypeScript type at every value-bearing position.

## How it works

This rule runs the same syntactic visitor as [`no-date`](./no-date.md) — so
`new Date()`, `Date()`, `Date.now()`, and `Date` type references are reported
exactly as they would be by the syntactic rule. On top of that, it also
visits each value-bearing AST anchor and asks the TypeScript type checker
for the type at that position. It reports if the type is `Date`, or if it is
a union, intersection, array, or tuple that contains `Date`.

Type-aware anchors checked:

- `VariableDeclarator` — every binding identifier produced by the declared
  pattern (including destructuring).
- `PropertyDefinition` — class fields.
- Function parameters — for `FunctionDeclaration`, `FunctionExpression`, and
  `ArrowFunctionExpression`, every binding identifier across the parameter
  pattern (including default values, destructuring, rest, and constructor
  `TSParameterProperty`).
- Function return type — the inferred return type of the same function-like
  nodes.

A single value can be reported by both the syntactic check and the type-aware
check (for example, `let x: Date = new Date()` produces a `noDateType`
report on the `Date` annotation, a `noDateConstructor` report on
`new Date()`, and a `noDateTypeChecked` report on the `x` binding). That
overlap is intentional: each report explains a different reason the value is
problematic.

## Replacement story

The replacements are the same as for [`no-date`](./no-date.md). At a glance:

- Need "now" inside an `Effect`? Use `DateTime.now` (`Clock`-backed) or
  `Clock.currentTimeMillis` / `Clock.currentTimeNanos`.
- Need a synchronous "now"? Use `DateTime.nowUnsafe`.
- Receiving a `Date` from a third-party API or JSON deserialization? Convert
  at the boundary with `DateTime.fromDateUnsafe` so the rest of the
  codebase deals in `DateTime.Utc` / `DateTime.Zoned` / `DateTime.DateTime`.
- Constructing from a literal? Use `DateTime.makeUnsafe` or `DateTime.make`.
- Parsing a zoned string? Use `DateTime.makeZonedFromString`.

For each replacement primitive, see the corresponding section in
[`no-date`](./no-date.md) — it has full vanilla-vs-Effect side-by-side
examples for `DateTime.now`, `DateTime.nowUnsafe`, `DateTime.nowInCurrentZone`,
`DateTime.make`, `DateTime.makeUnsafe`, `DateTime.fromDateUnsafe`,
`DateTime.makeZonedFromString`, `Clock.currentTimeMillis`,
`Clock.currentTimeNanos`, `DateTime.DateTime`, `DateTime.Utc`, and
`DateTime.Zoned`.

## Examples

### Syntactic violations (also caught by `no-date`)

Constructor and `Date.now()` calls plus literal `Date` type references are
all flagged exactly as in the syntactic [`no-date`](./no-date.md) rule:

```ts
const stamp = new Date();           // noDateConstructor (and noDateTypeChecked)
const millis = Date.now();          // noDateNow
function consume(stamp: Date) {}    // noDateType (and noDateTypeChecked on `stamp`)
```

### Inferred from a third-party return type

Vanilla:

```ts
import { someApi } from "third-party";

const stamp = someApi.getCreatedAt(); // inferred Date — flagged
```

Effect:

```ts
import { someApi } from "third-party";
import { DateTime } from "effect";

const stamp = DateTime.fromDateUnsafe(someApi.getCreatedAt());
```

### Inferred via callback contextual typing

Vanilla:

```ts
const stamps = rows.map((row) => row.createdAt); // Date[] — flagged
```

Effect:

```ts
import { DateTime } from "effect";

const stamps = rows.map((row) => DateTime.fromDateUnsafe(row.createdAt));
```

### Inferred class field

Vanilla:

```ts
class Job {
  createdAt = someApi.getCreatedAt(); // field type inferred Date — flagged
}
```

Effect:

```ts
import { DateTime } from "effect";

class Job {
  createdAt: DateTime.Utc = DateTime.fromDateUnsafe(someApi.getCreatedAt());
}
```

### Inferred function return type

Vanilla:

```ts
function makeStamp() {
  return someApi.getCreatedAt(); // inferred return Date — flagged
}
```

Effect:

```ts
import { DateTime } from "effect";

function makeStamp(): DateTime.Utc {
  return DateTime.fromDateUnsafe(someApi.getCreatedAt());
}
```

### Hidden inside `ReturnType`

Vanilla:

```ts
type Pair = readonly [string, ReturnType<typeof someApi.getCreatedAt>];

declare const pair: Pair;
const second = pair[1]; // inferred Date — flagged
```

Effect:

```ts
import { DateTime } from "effect";

type Pair = readonly [string, DateTime.DateTime];

declare const pair: Pair;
const second = pair[1];
```

## When not to use it

This rule requires type information and depends on `parserOptions.project`
(or `projectService`) being configured. It is meaningfully more expensive
than the syntactic [`no-date`](./no-date.md). If you cannot afford type-aware
linting in your editor or CI, use [`no-date`](./no-date.md) alone instead.

## Disabling

If a particular value genuinely needs to remain a `Date`, disable the rule
inline with a justification (the project's
`require-eslint-disable-justification` rule enforces this):

```ts
// eslint-disable-next-line no-date-type-checked -- third-party callback signature
//   forces a Date parameter that we hand straight back to the same library
//   without ever inspecting it.
api.onTick((stamp) => api.echo(stamp));
```

## Related rules

- [`no-date`](./no-date.md) — the cheaper syntactic-only sibling. Use one or
  the other, not both.
