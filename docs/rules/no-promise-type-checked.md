# `no-promise-type-checked`

Strict type-aware **superset** of [`no-promise`](./no-promise.md): in addition
to flagging every syntactic violation that `no-promise` flags
(`async`/`await`, `.then(...)`, `.catch(...)`, `Promise.*` static methods,
and `new Promise(...)`), this rule also asks the TypeScript type checker
whether a value's type is (or contains) the global JS `Promise` (or
`PromiseLike`) and reports it even when no `Promise` identifier appears at
the use site.

Use this rule **instead of** [`no-promise`](./no-promise.md), not alongside
it. Because `no-promise-type-checked` reports a strict superset of what
`no-promise` reports, enabling both would produce duplicate reports on every
syntactic violation. Pick one based on whether you can afford type-aware
linting:

- `enforce-effect/recommended` enables `no-promise` (cheap, syntactic only).
- `enforce-effect/recommended-type-checked` enables `no-promise-type-checked`
  and drops `no-promise` from the same config.

## Why?

Effect-oriented codebases prefer `Effect.Effect<A, E, R>` over the ambient
`Promise` type. The syntactic [`no-promise`](./no-promise.md) rule catches
`async function`, `await`, `.then(...)`, `.catch(...)`, `Promise.all`,
`new Promise(...)`, and so on — all of which mention `Promise` (or one of
its keywords) at the call site. But it misses every `Promise` value that
shows up purely via inference:

```ts
import { someApi } from "third-party";

const handle = someApi.fetchUser();              // inferred Promise<User>
const rows = db.query("SELECT *");               // inferred Promise<Row[]>
const handlers = items.map((item) => loadOne(item)); // Promise<T>[]
class Job { result = doWork(); }                 // class field Promise<R>
function load() { return someApi.fetchUser(); }  // inferred return Promise<User>
```

The syntactic rule cannot see these because the literal identifier
`Promise` never appears. This rule plugs that gap by checking the
TypeScript type at every value-bearing position.

## How it works

This rule runs the same syntactic visitor as [`no-promise`](./no-promise.md)
— so `async function`, `await`, `.then(...)`, `.catch(...)`, `Promise.all`,
`new Promise(...)`, and the rest of the `Promise.*` static methods are
reported exactly as they would be by the syntactic rule. On top of that, it
visits each value-bearing AST anchor and asks the TypeScript type checker
for the type at that position. It reports if the type is the global
`Promise` (or `PromiseLike`), or if it is a union, intersection, array, or
tuple that contains `Promise` / `PromiseLike`.

Type-aware anchors checked:

- `VariableDeclarator` — every binding identifier produced by the
  declared pattern (including destructuring).
- `PropertyDefinition` — class fields.
- Function parameters — for `FunctionDeclaration`, `FunctionExpression`,
  and `ArrowFunctionExpression`, every binding identifier across the
  parameter pattern (including default values, destructuring, rest, and
  constructor `TSParameterProperty`).
- Function return type — the inferred return type of the same
  function-like nodes.

Identification of the type-aware check is symbol-based: the type's symbol
must be named `Promise` or `PromiseLike` AND have a declaration in a
`lib.*.d.ts` file (typically `lib.es2015.promise.d.ts` /
`lib.es2018.promise.d.ts` / `lib.esnext.promise.d.ts`). User-defined
`Promise`/`PromiseLike` classes from `node_modules/...` (including
`Effect.Effect`) are NOT flagged by the type-aware check.

A single value can be reported by both the syntactic check and the type-aware
check (for example, `async function load() { return 1; }` produces a
`noAsync` report on the `async` keyword and a `noPromiseTypeChecked` report
on the inferred `Promise<number>` return type). That overlap is intentional:
each report explains a different reason the value is problematic.

`Effect.Effect<A, E, R>` is a separate type defined in `effect`, not in
`lib.*.d.ts`, so values whose inferred type is `Effect.Effect<...>` are
NOT flagged by this rule.

## Replacement story

The replacements are the same as for [`no-promise`](./no-promise.md). At
a glance:

- Wrap a `Promise`-returning third-party API at the boundary with
  `Effect.promise(() => api.fetchUser())` (no error mapping) or
  `Effect.tryPromise({ try, catch })` (with typed error). See
  `.reference/effect/packages/effect/src/Effect.ts` lines 1080
  (`Effect.promise`) and 1148 (`Effect.tryPromise`).
- Sequence subsequent steps with `yield*` inside `Effect.gen`, or with
  `Effect.flatMap`, `Effect.andThen`, `Effect.map`, and `Effect.tap`.
- Hand off to a callback API with `Effect.callback`
  (`.reference/effect/packages/effect/src/Effect.ts` line 1408) instead
  of `new Promise((resolve, reject) => ...)`.
- Run an `Effect` at the top of the program with
  `Effect.runPromise` (`.reference/effect/packages/effect/src/Effect.ts`
  line 8479) — this is one of the few places `Promise` is acceptable,
  at the runtime boundary.
- Concurrency: `Effect.all`, `Effect.partition`, `Effect.race`,
  `Effect.raceFirst`, `Effect.raceAll`.

For each replacement primitive, see the corresponding section in
[`no-promise`](./no-promise.md) — it has full vanilla-vs-Effect
side-by-side examples for `Effect.gen`, `Effect.fn`, `Effect.fnUntraced`,
`Effect.suspend`, `Effect.callback`, `Effect.flatMap`, `Effect.andThen`,
`Effect.map`, `Effect.tap`, `Effect.promise`, `Effect.tryPromise`,
`Effect.all`, `Effect.partition`, `Effect.race`, `Effect.raceFirst`,
`Effect.raceAll`, `Effect.succeed`, `Effect.fail`, `Effect.try`, and
`Deferred.make`.

The Effect type itself (`Effect.Effect<A, E, R>`) is defined at
`.reference/effect/packages/effect/src/Effect.ts` line 173.

## Examples

### Syntactic violations (also caught by `no-promise`)

`async`/`await`, `.then`/`.catch`, `Promise.*` statics, and `new Promise`
are flagged exactly as in the syntactic [`no-promise`](./no-promise.md)
rule:

```ts
async function load() { return 1; }    // noAsync (and noPromiseTypeChecked on the return)
const _ = await x;                     // noAwait (inside async)
new Promise((resolve) => resolve(1));  // noPromiseConstructor
Promise.resolve(1);                    // noPromiseStatic
loadConfig().then(handle);             // noPromiseChainThen
loadConfig().catch(handleError);       // noPromiseChainCatch
```

### Inferred from a third-party return type

Vanilla:

```ts
import { someApi } from "third-party";

const handle = someApi.fetchUser(); // inferred Promise<User> — flagged
```

Effect:

```ts
import { someApi } from "third-party";
import { Effect } from "effect";

const handle = Effect.promise(() => someApi.fetchUser());
```

### Inferred via callback contextual typing

Vanilla:

```ts
const handles = items.map((item) => loadOne(item)); // Promise<T>[] — flagged
```

Effect:

```ts
import { Effect } from "effect";

const handles = items.map((item) => Effect.promise(() => loadOne(item)));
```

### Inferred class field

Vanilla:

```ts
class Job {
  result = doWork(); // field type inferred Promise<R> — flagged
}
```

Effect:

```ts
import { Effect } from "effect";

class Job {
  result: Effect.Effect<R> = Effect.promise(() => doWork());
}
```

### Inferred function return type

Vanilla:

```ts
function load() {
  return someApi.fetchUser(); // inferred return Promise<User> — flagged
}
```

Effect:

```ts
import { Effect } from "effect";

const load = (): Effect.Effect<User, never> =>
  Effect.promise(() => someApi.fetchUser());
```

### Hidden inside `ReturnType`

Vanilla:

```ts
type Pair = readonly [string, ReturnType<typeof someApi.fetchUser>];

declare const pair: Pair;
const second = pair[1]; // inferred Promise<User> — flagged
```

Effect:

```ts
import { Effect } from "effect";

type Pair = readonly [string, Effect.Effect<User>];

declare const pair: Pair;
const second = pair[1];
```

## When not to use it

This rule requires type information and depends on `parserOptions.project`
(or `projectService`) being configured. It is meaningfully more expensive
than the syntactic [`no-promise`](./no-promise.md). If you cannot afford
type-aware linting in your editor or CI, use [`no-promise`](./no-promise.md)
alone instead.

The runtime boundary for an Effect program almost always involves at
least one `Promise` (e.g. `Effect.runPromise(program)`). Disable the
rule inline at that one site rather than disabling the rule project-wide.

## Disabling

If a particular value genuinely needs to remain a `Promise`, disable the
rule inline with a justification (the project's
`require-eslint-disable-justification` rule enforces this):

```ts
// eslint-disable-next-line no-promise-type-checked -- runtime boundary: this is the
//   one entry point that hands the Effect off to the JS event loop.
const result = Effect.runPromise(program);
```

## Related rules

- [`no-promise`](./no-promise.md) — the cheaper syntactic-only sibling. Use
  one or the other, not both.
