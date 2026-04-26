# `no-error-inferred`

Disallow values whose inferred TypeScript type is the global `Error`
(or one of its standard subclasses: `TypeError`, `RangeError`,
`SyntaxError`, `ReferenceError`, `EvalError`, `URIError`,
`AggregateError`) in favor of Effect-based failure primitives. This
is the **type-aware** companion to [`no-error`](./no-error.md): where
`no-error` matches the literal `Error` identifier in syntax, this rule
asks the TypeScript type checker whether a value's type is (or
contains) the global JS `Error` family, and reports it even when no
`Error` identifier appears at the use site.

This rule requires type information and ships under
`enforce-effect/recommended-type-checked` (not
`enforce-effect/recommended`), so users opt in once they're willing to
pay the type-checker cost.

## Why?

Effect-oriented codebases prefer domain-specific failure values and
yieldable error classes over the ambient `Error` constructor and the
built-in `Error` interface. The syntactic [`no-error`](./no-error.md)
rule stops you from typing the word `Error`, but that alone leaks
`Error` whenever the type comes from somewhere else:

```ts
try {
  /* ... */
} catch (e) {
  if (e instanceof Error) {
    const msg = e.message;             // e narrowed to Error
    handle(e);                         // passing Error
  }
}

function unwrap<E extends Error>(r: Result<T, E>) {
  return r.error;                      // inferred Error
}

const cached: Map<string, Error> = ...;
const oops = cached.get("k");          // Error | undefined
```

The syntactic rule misses every line above (other than the literal
`Error` annotations in the `try` and `Map`). This rule plugs that gap
by checking the TypeScript type at every value-bearing position.

## How it works

The rule visits each value-bearing AST anchor and asks the TypeScript
type checker for the type at that position. It reports if the type's
symbol is one of `Error`, `TypeError`, `RangeError`, `SyntaxError`,
`ReferenceError`, `EvalError`, `URIError`, or `AggregateError` AND that
symbol has a declaration in a `lib.*.d.ts` file (typically
`lib.es5.d.ts`, `lib.es2015.iterable.d.ts`, `lib.es2021.promise.d.ts`).
The check also recurses into unions, intersections, arrays, and
tuples that contain one of the banned types.

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

Identification is symbol-based. User-defined classes named `Error` (or
classes extending `Error` with their own name like
`MyDomainError extends Error`) declared outside of `lib.*.d.ts` are NOT
flagged on their own — but uses of `instanceof Error` that narrow back
to the global `Error` interface ARE flagged.

The rule deliberately does **not** skip nodes that already have an
`: Error` annotation. The syntactic [`no-error`](./no-error.md) rule
still fires on the literal `Error` identifier; this rule additionally
fires on the inferred-or-annotated value position. Users running both
rules should expect overlapping reports — that is intentional and
mirrors the `prefer-readonly` /
`prefer-readonly-parameter-types` split in `typescript-eslint`.

## Replacement story

The replacements are the same as for [`no-error`](./no-error.md). At a
glance:

- Build domain failure classes with `Data.TaggedError`
  (`.reference/effect/packages/effect/src/Data.ts` line 763) for
  tag-based recovery via `Effect.catchTag` / `Effect.catchTags`, or
  `Data.Error` (`.reference/effect/packages/effect/src/Data.ts` line
  719) when no tag is needed.
- Build schema-validated failure classes with
  `Schema.TaggedErrorClass`
  (`.reference/effect/packages/effect/src/Schema.ts` line 10800) or
  `Schema.ErrorClass`
  (`.reference/effect/packages/effect/src/Schema.ts` line 10746).
- Use the well-known `Cause` errors instead of generic `Error`:
  `Cause.NoSuchElementError`
  (`.reference/effect/packages/effect/src/Cause.ts` line 1145),
  `Cause.TimeoutError` (line 1317),
  `Cause.IllegalArgumentError` (line 1385),
  `Cause.ExceededCapacityError` (line 1453),
  `Cause.UnknownError` (line 1556).
- Type APIs that accept "any error" with `Cause.YieldableError`
  (`.reference/effect/packages/effect/src/Cause.ts` line 1092) instead
  of the ambient `Error`.
- Push failures through `Effect.fail(err)` so they live in the typed
  error channel `E` of `Effect.Effect<A, E, R>`.

For each replacement primitive, see the corresponding section in
[`no-error`](./no-error.md) — it has full vanilla-vs-Effect side-by-side
examples for `Data.TaggedError`, `Data.Error`,
`Schema.TaggedErrorClass`, `Schema.ErrorClass`, `Cause.UnknownError`,
`Cause.YieldableError`, `Cause.NoSuchElementError`, `Cause.TimeoutError`,
`Cause.IllegalArgumentError`, and `Cause.ExceededCapacityError`.

## Examples

### Inferred from `instanceof Error` narrowing

Vanilla:

```ts
try {
  step();
} catch (e) {
  if (e instanceof Error) {
    handle(e); // e narrowed to Error — flagged when handle's param is inferred
  }
}
```

Effect:

```ts
import { Effect, Data } from "effect";

class StepFailure extends Data.TaggedError("StepFailure")<{
  readonly cause: unknown;
}> {}

const program = Effect.try({
  try: () => step(),
  catch: (cause) => new StepFailure({ cause }),
});
```

### Inferred via constrained generic

Vanilla:

```ts
function unwrap<E extends Error>(r: { ok: false; error: E }) {
  return r.error; // inferred Error — flagged
}
```

Effect:

```ts
import { Cause } from "effect";

function unwrap<E extends Cause.YieldableError>(r: {
  readonly ok: false;
  readonly error: E;
}) {
  return r.error;
}
```

### Inferred from a generic container

Vanilla:

```ts
const cached: Map<string, Error> = new Map();
const oops = cached.get("k"); // inferred Error | undefined — flagged
```

Effect:

```ts
import { Cause, Option } from "effect";

const cached: Map<string, Cause.UnknownError> = new Map();
const oops = Option.fromNullishOr(cached.get("k"));
```

### Inferred class field

Vanilla:

```ts
function makeError() {
  return new Error("boom");
}

class Job {
  last = makeError(); // field type inferred Error — flagged
}
```

Effect:

```ts
import { Cause } from "effect";

class Job {
  last: Cause.UnknownError = new Cause.UnknownError("boom");
}
```

### Inferred function return type

Vanilla:

```ts
function maybeError(): Error | undefined {
  return undefined;
}

const e = maybeError(); // inferred Error | undefined — flagged
```

Effect:

```ts
import { Cause, Option } from "effect";

const maybeError = (): Option.Option<Cause.UnknownError> => Option.none();
const e = maybeError();
```

## When not to use it

This rule requires type information and depends on
`parserOptions.project` (or `projectService`) being configured. It is
meaningfully more expensive than the syntactic [`no-error`](./no-error.md).
If you cannot afford type-aware linting in your editor or CI, leave this
rule disabled and rely on `no-error` alone.

If you intentionally bridge with third-party libraries that throw
`Error` and you want to keep their `Error` type at exactly the bridge
site (e.g. inside an `Effect.try`'s `catch`), use an inline disable.

## Disabling

If a particular value genuinely needs to remain an `Error`, disable
the rule inline with a justification (the project's
`require-lint-disable-justification` rule enforces this):

```ts
// eslint-disable-next-line no-error-inferred -- third-party callback hands us
//   an Error that we immediately wrap in `Cause.UnknownError` on the next line.
const wrapped = (e: Error) => new Cause.UnknownError(e, e.message);
```

## Related rules

- [`no-error`](./no-error.md) — the syntactic companion that bans
  `new Error(...)` constructor calls and `Error` type references at the
  source level.
