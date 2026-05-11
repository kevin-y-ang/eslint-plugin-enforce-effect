# `no-and`

Disallow JavaScript logical AND (`&&`) and its compound assignment (`&&=`)
in favor of explicit Effect-friendly sequencing and guards.

## Why?

JavaScript's `&&` overloads two very different ideas: "compute B only when A
is truthy" and "return the first falsy value, otherwise the last operand".
The compound form `a &&= b` layers conditional mutation on top.
Effect-oriented codebases prefer to split those intents across dedicated
primitives so short-circuits live in the program shape (error channel,
`Option`, `Result`) instead of being implicit in a boolean expression, and
they avoid in-place mutation in favor of deriving a new `const` or updating
a `Ref`.

## Primitives

### `Boolean.and`

Plain boolean AND (`self && that`) as a named, pipeable function; use it when
both operands are already `boolean` and you want to reuse the value without
threading `&&` through a ternary.

Vanilla:

```ts
declare const isOwner: boolean;
declare const hasWriteScope: boolean;
const canEdit: boolean = isOwner && hasWriteScope;
```

Effect:

```ts
import { Boolean } from "effect";

declare const isOwner: boolean;
declare const hasWriteScope: boolean;
const canEdit: boolean = Boolean.and(isOwner, hasWriteScope);
```

### `Option.flatMap`

Sequences a dependent `Option` step after a `Some`, short-circuiting on
`None`; use it instead of `a && a.b` when `a` is an absent value you have
already modeled as `Option`.

Vanilla:

```ts
declare const user: { team?: { id: string } } | null;
const teamId: string | undefined = user && user.team && user.team.id;
```

Effect:

```ts
import { Option, pipe } from "effect";

declare const user: { team?: { id: string } } | null;
const teamId: Option.Option<string> = pipe(
  Option.fromNullishOr(user),
  Option.flatMap((u) => Option.fromNullishOr(u.team)),
  Option.map((t) => t.id),
);
```

### `Option.andThen`

Flexible sequencer for `Option`: the second step can be another `Option`, a
plain value, or a function returning either; use it to discard-left in a
pipe instead of `a && b` when both are already `Option`s.

Vanilla:

```ts
declare const hasPermission: { tag: "Some" } | { tag: "None" };
declare const record: { tag: "Some"; value: number } | { tag: "None" };
const out =
  hasPermission.tag === "Some" &&
  record.tag === "Some" &&
  record.value;
```

Effect:

```ts
import { Option } from "effect";

declare const hasPermission: Option.Option<void>;
declare const record: Option.Option<number>;
const out: Option.Option<number> = Option.andThen(hasPermission, record);
```

### `Option.zipRight`

`Option` analog of `*>`: runs the second `Option` only when the first is
`Some`, and keeps the second's value; use it when the first `Option` is
only a guard and you want to name the intent explicitly.

Vanilla:

```ts
declare const acknowledged: unknown;
declare const payload: number | undefined;
const value: number | undefined = acknowledged && payload;
```

Effect:

```ts
import { Option } from "effect";

declare const acknowledged: Option.Option<void>;
declare const payload: Option.Option<number>;
const value: Option.Option<number> = Option.zipRight(acknowledged, payload);
```

### `Option.filter`

Turns `Some(x)` into `None` when a predicate is false; use it instead of
`x && isValid(x) && x` when you want to keep the value only if it passes a
guard.

Vanilla:

```ts
declare const n: number | undefined;
const positive: number | undefined = n && n > 0 ? n : undefined;
```

Effect:

```ts
import { Option } from "effect";

declare const n: number | undefined;
const positive: Option.Option<number> = Option.filter(
  Option.fromUndefinedOr(n),
  (x) => x > 0,
);
```

### `Effect.flatMap`

Sequences dependent effects: the continuation runs only when the first
effect succeeds; use it instead of `a && b` when A is an `Effect` and B
depends on A's success value.

Vanilla:

```ts
const out = await loadUser().then((u) => u && fetchProfile(u.id));
```

Effect:

```ts
import { Effect } from "effect";

declare const loadUser: Effect.Effect<{ id: string }, Error>;
declare const fetchProfile: (id: string) => Effect.Effect<unknown, Error>;
const out = Effect.flatMap(loadUser, (u) => fetchProfile(u.id));
```

### `Effect.andThen`

Flexible sequencer: when passed another `Effect` it behaves like
`flatMap(() => next)`—the "discard-left" pattern (replaces Effect 3.x
`zipRight`); use it when the first effect is only a side effect you want to
run before the second.

Vanilla:

```ts
const ready = await checkAuth().then((ok) => ok && fetchDashboard());
```

Effect:

```ts
import { Effect } from "effect";

declare const checkAuth: Effect.Effect<void, Error>;
declare const fetchDashboard: Effect.Effect<unknown, Error>;
const ready = Effect.andThen(checkAuth, fetchDashboard);
```

### `Effect.when`

Runs an effect only when an effectful `boolean` condition is true, wrapping
the result in `Option`; use it instead of `shouldRun && perform()` when
"skip" should be a first-class outcome.

Vanilla:

```ts
const maybeResult = shouldSync && (await syncRows());
```

Effect:

```ts
import { Effect } from "effect";

declare const shouldSync: Effect.Effect<boolean>;
declare const syncRows: Effect.Effect<number>;
const maybeResult = Effect.when(syncRows, shouldSync);
```

### `Effect.filterOrFail`

Keeps the success value only when a predicate passes, failing with a typed
error otherwise; use it instead of `result && isValid(result)` when the
"guard failed" case should surface on the error channel.

Vanilla:

```ts
const value = (await compute()) && undefined; // oops, lost the error intent
```

Effect:

```ts
import { Effect } from "effect";

declare const compute: Effect.Effect<number, Error>;
const value = Effect.filterOrFail(
  compute,
  (n) => n > 0,
  (n) => new Error(`non-positive: ${n}`),
);
```

### `Effect.filterOrElse`

Same idea as `filterOrFail` but routes the guard failure to an alternative
`Effect` instead of failing; use it when the "predicate was false" branch
still has a recovery effect, not just an error.

Vanilla:

```ts
const value = (await fetchValue()) && (await computeFallback());
```

Effect:

```ts
import { Effect } from "effect";

declare const fetchValue: Effect.Effect<number, Error>;
declare const computeFallback: (n: number) => Effect.Effect<number, Error>;
const value = Effect.filterOrElse(
  fetchValue,
  (n) => n > 0,
  (n) => computeFallback(n),
);
```

### `Result.flatMap`

Sequences dependent `Result` steps, short-circuiting on `Failure`; use it
instead of `result && nextStep(result)` when `Result` is modeling the
success/failure union.

Vanilla:

```ts
type R<A> = { ok: true; value: A } | { ok: false; err: string };
declare const parsed: R<string>;
declare const validate: (s: string) => R<number>;
const n: number | undefined = parsed.ok && validate(parsed.value).ok
  ? (validate(parsed.value) as { ok: true; value: number }).value
  : undefined;
```

Effect:

```ts
import { Result } from "effect";

declare const parsed: Result.Result<string, string>;
declare const validate: (s: string) => Result.Result<number, string>;
const n: Result.Result<number, string> = Result.flatMap(parsed, validate);
```

### `Result.andThen`

Flexible sequencer for `Result`: the second step can be another `Result`, a
value, or a function returning either; use it when the first `Result` is
only a guard and you want the second step's value.

Vanilla:

```ts
const proceed = first.ok && second;
```

Effect:

```ts
import { Result } from "effect";

declare const first: Result.Result<void, string>;
declare const second: Result.Result<number, string>;
const proceed: Result.Result<number, string> = Result.andThen(first, second);
```

### `Result.filterOrFail`

Refines the success of a `Result` by a predicate, producing a typed failure
when the predicate is false; use it instead of `r.ok && predicate(r.value)`
to keep the "predicate failed" case on the failure channel.

Vanilla:

```ts
type R = { ok: true; value: number } | { ok: false; err: string };
declare const r: R;
const positive: R = r.ok && r.value > 0 ? r : { ok: false, err: "non-positive" };
```

Effect:

```ts
import { Result } from "effect";

declare const r: Result.Result<number, string>;
const positive: Result.Result<number, string> = Result.filterOrFail(
  r,
  (n) => n > 0,
  (n) => `non-positive: ${n}`,
);
```

## Compound assignment (`&&=`)

`a &&= b` means "reassign `a` to `b` only when `a` is truthy"—a conditional
mutation. The Effect idiom is almost always to drop the mutation and bind a
new `const` using the primitives above. When the cell genuinely needs to be
mutable, use a `Ref` (or `SynchronizedRef` / `SubscriptionRef`) and pass an
`Option`-returning function so the update only fires under the condition.

### Avoid mutation: bind a new `const`

Vanilla:

```ts
let name: string | undefined = fetchName();
name &&= name.toUpperCase();
```

Effect:

```ts
import { Option } from "effect";

const name: Option.Option<string> = Option.map(
  Option.fromUndefinedOr(fetchName()),
  (n) => n.toUpperCase(),
);
```

### `Ref.updateSome`

Updates a `Ref` only when the callback returns `Some`; use it to encode
`a &&= b` on a shared mutable cell without losing atomicity.

Vanilla:

```ts
let state: string | undefined;
state &&= derive(state);
```

Effect:

```ts
import { Effect, Option, Ref } from "effect";

declare const ref: Ref.Ref<string | undefined>;
declare const derive: (s: string) => string;
const updated: Effect.Effect<void> = Ref.updateSome(ref, (value) =>
  value ? Option.some(derive(value)) : Option.none(),
);
```

### `Ref.modifySome`

Same idea as `updateSome`, but also lets the callback return a computed
result alongside the new cell value; use it when the `&&=` site should also
return the previous or newly-written value.

Vanilla:

```ts
let counter: number | undefined = 1;
const before = counter;
counter &&= counter + 1;
```

Effect:

```ts
import { Effect, Option, Ref } from "effect";

declare const ref: Ref.Ref<number | undefined>;
const before: Effect.Effect<number | undefined> = Ref.modifySome(ref, (current) =>
  current ? [current, Option.some(current + 1)] : [current, Option.none()],
);
```
