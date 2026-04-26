# `no-promise-inferred`

Disallow values whose inferred TypeScript type is the global `Promise` (or
`PromiseLike`) in favor of Effect-based asynchronous primitives. This is
the **type-aware** companion to [`no-promise`](./no-promise.md): where
`no-promise` matches the literal `Promise` identifier, `async`/`await`,
`.then(...)`, and `.catch(...)` syntactically, this rule asks the
TypeScript type checker whether a value's type is (or contains) the
global JS `Promise`, and reports it even when no `Promise` identifier
appears at the use site.

This rule requires type information and ships under
`enforce-effect/recommended-type-checked` (not `enforce-effect/recommended`),
so users opt in once they're willing to pay the type-checker cost.

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

The rule visits each value-bearing AST anchor and asks the TypeScript
type checker for the type at that position. It reports if the type is
the global `Promise` (or `PromiseLike`), or if it is a union,
intersection, array, or tuple that contains `Promise` /
`PromiseLike`.

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

Identification is symbol-based: the type's symbol must be named
`Promise` or `PromiseLike` AND have a declaration in a
`lib.*.d.ts` file (typically
`lib.es2015.promise.d.ts` / `lib.es2018.promise.d.ts` /
`lib.esnext.promise.d.ts`). User-defined `Promise`/`PromiseLike`
classes from `node_modules/...` (including `Effect.Effect`) are NOT
flagged.

The rule deliberately does **not** skip nodes that already have a
`: Promise<T>` type annotation. The syntactic
[`no-promise`](./no-promise.md) rule still fires on the literal
`Promise` identifier; this rule additionally fires on the
inferred-or-annotated value position. Users running both rules should
expect overlapping reports — that is intentional and mirrors the
`prefer-readonly` / `prefer-readonly-parameter-types` split in
`typescript-eslint`.

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
type-aware linting in your editor or CI, leave this rule disabled and rely
on `no-promise` alone.

The runtime boundary for an Effect program almost always involves at
least one `Promise` (e.g. `Effect.runPromise(program)`). Disable the
rule inline at that one site rather than disabling the rule project-wide.

## Disabling

If a particular value genuinely needs to remain a `Promise`, disable the
rule inline with a justification (the project's
`require-lint-disable-justification` rule enforces this):

```ts
// eslint-disable-next-line no-promise-inferred -- runtime boundary: this is the
//   one entry point that hands the Effect off to the JS event loop.
const result = Effect.runPromise(program);
```

## Related rules

- [`no-promise`](./no-promise.md) — the syntactic companion that bans
  `async`/`await`, `.then(...)`, `.catch(...)`, `Promise.*` static
  methods, and `new Promise(...)` at the source level.
