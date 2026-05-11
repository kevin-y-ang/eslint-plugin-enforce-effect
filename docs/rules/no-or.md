# `no-or`

Disallow JavaScript logical OR (`||`) and its compound assignment (`||=`) in
favor of explicit Effect-friendly fallbacks.

## Why?

JavaScript's `||` conflates three distinct fallbacks: "recover from an
error", "supply a default for an absent value", and "boolean disjunction".
The compound form `a ||= b` layers conditional mutation on top.
Effect-oriented codebases prefer to route each through its own primitive so
the fallback reason (failure vs absence vs boolean) is visible in the
program shape instead of hidden inside a `||`, and they avoid in-place
mutation in favor of deriving a new `const` or updating a `Ref`.

## Primitives

### `Boolean.or`

Plain boolean OR (`self || that`) as a named, pipeable function; use it
when both operands are already `boolean` and you want to combine them
without an inline `||`.

Vanilla:

```ts
declare const isOwner: boolean;
declare const isAdmin: boolean;
const canEdit: boolean = isOwner || isAdmin;
```

Effect:

```ts
import { Boolean } from "effect";

declare const isOwner: boolean;
declare const isAdmin: boolean;
const canEdit: boolean = Boolean.or(isOwner, isAdmin);
```

### `Option.orElse`

Tries a second `Option` when the first is `None` (lazy); use it for
priority chains (`a || b || c`) where every candidate is modeled as
`Option`.

Vanilla:

```ts
declare const primary: string | null;
declare const backup: string | undefined;
const label: string | undefined = primary || backup;
```

Effect:

```ts
import { Option, pipe } from "effect";

declare const primary: string | null;
declare const backup: string | undefined;
const label: Option.Option<string> = pipe(
  Option.fromNullishOr(primary),
  Option.orElse(() => Option.fromNullishOr(backup)),
);
```

### `Option.orElseSome`

Falls back to a lazy plain value on `None`, returning an `Option` that is
guaranteed `Some`; use it when the fallback is a concrete value rather than
another candidate `Option`.

Vanilla:

```ts
declare const title: string | undefined;
const resolved: string = title || "Untitled";
```

Effect:

```ts
import { Option } from "effect";

declare const title: string | undefined;
const resolved: Option.Option<string> = Option.orElseSome(
  Option.fromUndefinedOr(title),
  () => "Untitled",
);
```

### `Option.firstSomeOf`

Picks the first `Some` from an iterable of `Option`s; use it instead of a
long chain of `a || b || c || d` when every candidate is already an
`Option`.

Vanilla:

```ts
declare const a: string | null;
declare const b: string | null;
declare const c: string | null;
const first: string | null = a || b || c;
```

Effect:

```ts
import { Option } from "effect";

declare const a: string | null;
declare const b: string | null;
declare const c: string | null;
const first: Option.Option<string> = Option.firstSomeOf([
  Option.fromNullishOr(a),
  Option.fromNullishOr(b),
  Option.fromNullishOr(c),
]);
```

### `Option.getOrElse`

Unwraps a `Some` or supplies a lazy default for `None`; use it at the end
of an `Option` chain instead of `|| default` on the raw nullable value.

Vanilla:

```ts
declare const title: string | undefined;
const out: string = title || "Untitled";
```

Effect:

```ts
import { Option } from "effect";

declare const title: string | undefined;
const out: string = Option.getOrElse(
  Option.fromUndefinedOr(title),
  () => "Untitled",
);
```

### `Option.getOrNull`

Turns `None` into `null` and unwraps `Some`; use it when a caller expects
`A | null`, instead of normalizing with `value || null`.

Vanilla:

```ts
declare const s: string | undefined;
const out: string | null = s || null;
```

Effect:

```ts
import { Option } from "effect";

declare const s: string | undefined;
const out: string | null = Option.getOrNull(Option.fromUndefinedOr(s));
```

### `Option.getOrUndefined`

Turns `None` into `undefined` and unwraps `Some`; use it for optional
property slots, instead of `value || undefined`.

Vanilla:

```ts
declare const s: string | null;
const out: string | undefined = s || undefined;
```

Effect:

```ts
import { Option } from "effect";

declare const s: string | null;
const out: string | undefined = Option.getOrUndefined(Option.fromNullOr(s));
```

### `Effect.catch`

Recovers from any typed failure by running a fallback `Effect` (replaces
Effect 3.x `catchAll`); use it instead of `program || fallback` when the
fallback exists because A might fail.

Vanilla:

```ts
const result = (await loadFromCache().catch(() => undefined)) || (await loadFromNetwork());
```

Effect:

```ts
import { Effect } from "effect";

declare const loadFromCache: Effect.Effect<unknown, Error>;
declare const loadFromNetwork: Effect.Effect<unknown, Error>;
const result = Effect.catch(loadFromCache, () => loadFromNetwork);
```

### `Effect.catchCause`

Recovers from the full `Cause` of a failure (recoverable errors and
defects) by running a fallback effect (replaces Effect 3.x
`catchAllCause`); use it when you need to branch on both channels, not
just typed failures.

Vanilla:

```ts
let result;
try {
  result = await program();
} catch {
  result = await fallback();
}
```

Effect:

```ts
import { Effect } from "effect";

declare const program: Effect.Effect<unknown, Error>;
declare const fallback: Effect.Effect<unknown>;
const result = Effect.catchCause(program, () => fallback);
```

### `Effect.catchTag`

Recovers from a single tagged failure by matching `_tag`, leaving other
failures on the channel; use it for selective `||`-style recovery when the
error union has multiple branches.

Vanilla:

```ts
let value;
try {
  value = await fetchUser(id);
} catch (e) {
  if ((e as { _tag?: string })._tag === "NotFound") value = fallback;
  else throw e;
}
```

Effect:

```ts
import { Effect } from "effect";

declare const fetchUser: Effect.Effect<User, { _tag: "NotFound" } | { _tag: "Unauthorized" }>;
declare const fallback: Effect.Effect<User>;
const value = Effect.catchTag(fetchUser, "NotFound", () => fallback);
```

### `Effect.catchTags`

Handles several tagged failures in one call with a record of handlers; use
it instead of stacking multiple `try`/`||` pairs when each failure branch
has its own recovery.

Vanilla:

```ts
try {
  value = await fetchUser(id);
} catch (e) {
  if ((e as { _tag?: string })._tag === "NotFound") value = cached;
  else if ((e as { _tag?: string })._tag === "Unauthorized") value = guest;
  else throw e;
}
```

Effect:

```ts
import { Effect } from "effect";

declare const fetchUser: Effect.Effect<User, { _tag: "NotFound" } | { _tag: "Unauthorized" }>;
declare const cached: Effect.Effect<User>;
declare const guest: Effect.Effect<User>;
const value = Effect.catchTags(fetchUser, {
  NotFound: () => cached,
  Unauthorized: () => guest,
});
```

### `Effect.catchIf`

Recovers only when a predicate on the error says so, leaving other
failures on the channel; use it instead of `try { … } catch (e) { if (…) …
else throw e }` when the discriminator isn't a `_tag`.

Vanilla:

```ts
try {
  await writeFile(path, data);
} catch (e) {
  if ((e as NodeJS.ErrnoException).code === "ENOSPC") await writeToBackup();
  else throw e;
}
```

Effect:

```ts
import { Effect } from "effect";

declare const writeFile: (path: string, data: Uint8Array) => Effect.Effect<void, NodeJS.ErrnoException>;
declare const writeToBackup: Effect.Effect<void>;
const task = Effect.catchIf(
  writeFile("/x", new Uint8Array()),
  (e) => e.code === "ENOSPC",
  () => writeToBackup,
);
```

### `Effect.orElseSucceed`

Replaces any failure with a lazy pure success value, leaving the success
path unchanged; use it when the fallback for `||` is a constant, not
another effect.

Vanilla:

```ts
const count = (await fetchCount().catch(() => undefined)) || 0;
```

Effect:

```ts
import { Effect } from "effect";

declare const fetchCount: Effect.Effect<number, Error>;
const count = Effect.orElseSucceed(fetchCount, () => 0);
```

### `Effect.matchEffect`

Splits success and failure into two explicit branches, each returning an
`Effect`; use it instead of mixing `||` with ternaries when both outcomes
need real effectful handling.

Vanilla:

```ts
let next;
try {
  next = await loadConfig();
} catch {
  next = await loadDefaults();
}
```

Effect:

```ts
import { Effect } from "effect";

declare const loadConfig: Effect.Effect<Config, Error>;
declare const loadDefaults: Effect.Effect<Config>;
declare const applyConfig: (c: Config) => Effect.Effect<void>;
const next = Effect.matchEffect(loadConfig, {
  onFailure: () => loadDefaults,
  onSuccess: (c) => applyConfig(c),
});
```

### `Result.orElse`

Tries a second `Result` when the first is `Failure`, letting the handler
see the error; use it instead of `r.ok ? r.value : fallback.value` to keep
the fallback on the same channel.

Vanilla:

```ts
type R<A> = { ok: true; value: A } | { ok: false; err: string };
declare const primary: R<number>;
declare const backup: R<number>;
const chosen: R<number> = primary.ok ? primary : backup;
```

Effect:

```ts
import { Result } from "effect";

declare const primary: Result.Result<number, string>;
declare const backup: Result.Result<number, string>;
const chosen: Result.Result<number, string> = Result.orElse(
  primary,
  () => backup,
);
```

### `Result.getOrElse`

Unwraps a success or computes a value from the failure; use it instead of
`r.ok ? r.value : fallback` at the end of a `Result` chain.

Vanilla:

```ts
type R = { ok: true; value: number } | { ok: false; err: string };
declare const r: R;
const n: number = (r.ok ? r.value : undefined) || 0;
```

Effect:

```ts
import { Result } from "effect";

declare const r: Result.Result<number, string>;
const n: number = Result.getOrElse(r, () => 0);
```

## Compound assignment (`||=`)

`a ||= b` means "reassign `a` to `b` only when `a` is falsy"—a conditional
mutation. The Effect idiom is almost always to drop the mutation and bind a
new `const` using the primitives above. When the cell genuinely needs to be
mutable, use a `Ref` (or `SynchronizedRef` / `SubscriptionRef`) and pass an
`Option`-returning function so the update only fires under the condition;
for map entries use `HashMap.modifyAt`, whose `UpdateFn` receives the
current `Option` and can return `Some(next)` when the slot is empty.

### Avoid mutation: bind a new `const`

Vanilla:

```ts
let label: string | undefined = readLabel();
label ||= "Untitled";
```

Effect:

```ts
import { Option } from "effect";

const label: string = Option.getOrElse(
  Option.fromUndefinedOr(readLabel()),
  () => "Untitled",
);
```

### `Ref.updateSome`

Updates a `Ref` only when the callback returns `Some`; use it to encode
`a ||= b` on a shared mutable cell by returning `Some(fallback)` when the
current value is falsy.

Vanilla:

```ts
let state: string | undefined;
state ||= defaultState;
```

Effect:

```ts
import { Effect, Option, Ref } from "effect";

declare const ref: Ref.Ref<string | undefined>;
declare const defaultState: string;
const updated: Effect.Effect<void> = Ref.updateSome(ref, (value) =>
  value ? Option.none() : Option.some(defaultState),
);
```

### `Ref.getAndUpdateSome`

Returns the current value and optionally updates the ref in one atomic
step; use it when the `||=` site also needs the prior value for logging,
metrics, or return.

Vanilla:

```ts
let token: string | undefined;
const prior = token;
token ||= mintToken();
```

Effect:

```ts
import { Effect, Option, Ref } from "effect";

declare const ref: Ref.Ref<string | undefined>;
declare const mintToken: () => string;
const prior: Effect.Effect<string | undefined> = Ref.getAndUpdateSome(
  ref,
  (value) => (value ? Option.none() : Option.some(mintToken())),
);
```

### `HashMap.modifyAt`

Reads the optional value at a key and lets the callback return a new
`Option` for that slot; use it instead of `map[key] ||= defaultFor(key)`
when the "absent" case should initialize the entry.

Vanilla:

```ts
const counts: Record<string, number> = {};
counts[bucket] ||= 0;
counts[bucket] += 1;
```

Effect:

```ts
import { HashMap, Option } from "effect";

declare let counts: HashMap.HashMap<string, number>;
counts = HashMap.modifyAt(counts, bucket, (current) =>
  Option.some(Option.getOrElse(current, () => 0) + 1),
);
```
