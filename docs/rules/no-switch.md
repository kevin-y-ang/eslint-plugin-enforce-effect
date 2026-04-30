# `no-switch`

Disallow JavaScript `switch` statements in favor of explicit branching.

## Why?

Effect-oriented codebases often prefer branch logic to be written in ways that
compose more directly with expressions, handlers, and explicit control flow.

## Primitives

### `Match.type`

Builds a matcher for a static union type and returns a function you call with a value; use it when the input type is known up front and you will chain `Match.when`, discriminators, or other patterns.

Vanilla:

```ts
type Label = { kind: "ok"; n: number } | { kind: "err"; msg: string };
declare const x: Label;
let y: string;
switch (x.kind) {
  case "ok":
    y = `ok: ${x.n}`;
    break;
  case "err":
    y = x.msg;
    break;
}
```

Effect:

```ts
import { Match, pipe } from "effect";

type Label = { kind: "ok"; n: number } | { kind: "err"; msg: string };
const format = pipe(
  Match.type<Label>(),
  Match.when({ kind: "ok" }, (v) => `ok: ${v.n}`),
  Match.when({ kind: "err" }, (v) => v.msg),
  Match.exhaustive,
);
// format(x)
```

### `Match.value`

Creates a matcher wired to one concrete value; use it when the subject is already in hand and you want to pipe patterns in order until one matches (often with `Match.orElse` for the fallback).

Vanilla:

```ts
declare const user: { role: "admin" | "user"; name: string };
let msg: string;
switch (user.role) {
  case "admin":
    msg = "admin";
    break;
  default:
    msg = "other";
    break;
}
```

Effect:

```ts
import { Match, pipe } from "effect";

declare const user: { role: "admin" | "user"; name: string };
const msg = pipe(
  Match.value(user),
  Match.when({ role: "admin" }, () => "admin"),
  Match.orElse(() => "other"),
);
```

### `Match.when`

Adds a single pattern branch (literal object, predicate, or refinement like `Match.number`); use it as the main building block for `Match.type` / `Match.value` pipelines.

Vanilla:

```ts
declare const x: string | number;
let s: string;
switch (typeof x) {
  case "string":
    s = x.toUpperCase();
    break;
  case "number":
    s = String(x * 2);
    break;
}
```

Effect:

```ts
import { Match, pipe } from "effect";

const format = pipe(
  Match.type<string | number>(),
  Match.when(Match.string, (str) => str.toUpperCase()),
  Match.when(Match.number, (n) => String(n * 2)),
  Match.exhaustive,
);
// format(x)
```

### `Match.exhaustive`

Finishes a matcher and proves at compile time that no union member is left unhandled; use it when you want the same guarantee as a total `switch` with no `default`.

Vanilla:

```ts
type T = "a" | "b";
declare const t: T;
let n: number;
switch (t) {
  case "a":
    n = 1;
    break;
  case "b":
    n = 2;
    break;
}
```

Effect:

```ts
import { Match, pipe } from "effect";

type T = "a" | "b";
const code = pipe(
  Match.type<T>(),
  Match.when("a", () => 1 as const),
  Match.when("b", () => 2 as const),
  Match.exhaustive,
);
// code(t)
```

### `Match.tags`

Maps each `_tag` of a discriminated union to an optional handler; use it for `_tag`-style unions when some tags can share a path or you will still close with `Match.exhaustive` or `Match.orElse`.

Vanilla:

```ts
type Evt = { readonly _tag: "A" } | { readonly _tag: "B"; n: number };
declare const e: Evt;
let s: string;
switch (e._tag) {
  case "A":
    s = "a";
    break;
  case "B":
    s = `b${e.n}`;
    break;
}
```

Effect:

```ts
import { Match, pipe } from "effect";

type Evt = { readonly _tag: "A" } | { readonly _tag: "B"; n: number };
const go = pipe(
  Match.type<Evt>(),
  Match.tags({
    A: () => "a",
    B: (b) => `b${b.n}`,
  }),
  Match.exhaustive,
);
// go(e)
```

### `Match.tagsExhaustive`

Requires a handler for every `_tag` and completes the matcher in one step; use it for `_tag` unions when you want total coverage without a separate `Match.exhaustive`.

Vanilla:

```ts
type U = { _tag: "A"; a: string } | { _tag: "B"; b: number };
declare const u: U;
const r = (() => {
  switch (u._tag) {
    case "A":
      return u.a;
    case "B":
      return String(u.b);
  }
})();
```

Effect:

```ts
import { Match, pipe } from "effect";

type U = { _tag: "A"; a: string } | { _tag: "B"; b: number };
const format = pipe(
  Match.type<U>(),
  Match.tagsExhaustive({
    A: (x) => x.a,
    B: (x) => String(x.b),
  }),
);
// format(u)
```

### `Match.typeTags`

Builds a pre-wired function for a `_tag` union, optionally fixing a single return type; use it for reusable formatters on tagged unions (same idea as a total `switch` on `_tag`).

Vanilla:

```ts
type R = { _tag: "Ok"; v: number } | { _tag: "Err"; e: string };
declare const r: R;
const s = (() => {
  switch (r._tag) {
    case "Ok":
      return `ok:${r.v}`;
    case "Err":
      return r.e;
  }
})();
```

Effect:

```ts
import { Match } from "effect";

type R = { _tag: "Ok"; v: number } | { _tag: "Err"; e: string };
const show = Match.typeTags<R, string>()({
  Ok: (x) => `ok:${x.v}`,
  Err: (x) => x.e,
});
// show(r)
```

### `Match.valueTags`

Dispatches a single tagged value through a record of per-tag handlers; use it when you have one value and a clear table of cases keyed by `_tag` (a direct alterVanilla to `switch` on `x._tag`).

Vanilla:

```ts
type S = { _tag: "T"; a: 1 } | { _tag: "F"; b: 2 };
const x: S = { _tag: "T", a: 1 };
const r = (() => {
  switch (x._tag) {
    case "T":
      return x.a;
    case "F":
      return x.b;
  }
})();
```

Effect:

```ts
import { Match } from "effect";

type S = { _tag: "T"; a: 1 } | { _tag: "F"; b: 2 };
const x: S = { _tag: "T", a: 1 };
const r = Match.valueTags(x, {
  T: (v) => v.a,
  F: (v) => v.b,
});
```

### `Match.discriminator`

Matches a fixed list of values for a chosen field (for example `type` or `kind`); use it when several literals should share a handler and you do not need an object map yet.

Vanilla:

```ts
type D = { type: "A"; n: number } | { type: "B"; n: number } | { type: "C" };
declare const d: D;
const r = (() => {
  switch (d.type) {
    case "A":
    case "B":
      return d.n;
    case "C":
      return 0;
  }
})();
```

Effect:

```ts
import { Match, pipe } from "effect";

type D = { type: "A"; n: number } | { type: "B"; n: number } | { type: "C" };
const pick = pipe(
  Match.type<D>(),
  Match.discriminator("type")("A", "B", (ab) => ab.n),
  Match.discriminator("type")("C", () => 0),
  Match.exhaustive,
);
// pick(d)
```

### `Match.discriminators`

Supplies a record of handlers for every value of a non-`_tag` discriminant field; use it for unions like `{ type: "A" } | { type: "B" }` when you want the same table-of-branches feel as a `switch` on that field (often closed with `Match.exhaustive`).

Vanilla:

```ts
type U = { t: "x"; a: 1 } | { t: "y"; b: 2 };
declare const u: U;
const r = (() => {
  switch (u.t) {
    case "x":
      return u.a;
    case "y":
      return u.b;
  }
})();
```

Effect:

```ts
import { Match, pipe } from "effect";

type U = { t: "x"; a: 1 } | { t: "y"; b: 2 };
const f = pipe(
  Match.type<U>(),
  Match.discriminators("t")({
    x: (l) => l.a,
    y: (r) => r.b,
  }),
  Match.exhaustive,
);
// f(u)
```

### `Match.orElse`

Provides the default when no previous pattern matches; use it in place of the final `default` case of a `switch`.

Vanilla:

```ts
type Code = 200 | 404;
declare const c: Code;
const msg = (() => {
  switch (c) {
    case 200:
      return "ok";
    default:
      return "nope";
  }
})();
```

Effect:

```ts
import { Match, pipe } from "effect";

type Code = 200 | 404;
const msg = (c: Code) =>
  pipe(
    Match.value(c),
    Match.when(200, () => "ok" as const),
    Match.orElse(() => "nope" as const),
  );
```

### `Option.match`

Folds a `Option<A>` by handling `None` and `Some` in one expression; use it when you would otherwise `switch` on the option’s shape or tag.

Vanilla:

```ts
import { Option } from "effect";
declare const o: Option.Option<number>;
const s = (() => {
  switch (o._tag) {
    case "None":
      return "empty";
    case "Some":
      return String(o.value);
  }
})();
```

Effect:

```ts
import { Option } from "effect";

declare const o: Option.Option<number>;
const s = Option.match(o, {
  onNone: () => "empty",
  onSome: (n) => String(n),
});
```

### `Result.match`

Folds a `Result` on success and failure; use it instead of switching on a success / error variant.

Vanilla:

```ts
import { Result } from "effect";
declare const r: Result.Result<number, string>;
const s = (() => {
  switch (r._tag) {
    case "Failure":
      return `err:${r.failure}`;
    case "Success":
      return `ok:${r.success}`;
  }
})();
```

Effect:

```ts
import { Result } from "effect";

declare const r: Result.Result<number, string>;
const s = Result.match(r, {
  onFailure: (e) => `err:${e}`,
  onSuccess: (n) => `ok:${n}`,
});
```

### `Exit.match`

Folds an `Exit` into a value by handling success and failure (including a `Cause` on failure); use it for interpreter-style `switch`es on the outcome of a fiber or `Effect.runSyncExit` result.

Vanilla:

```ts
import { Exit } from "effect";
declare const e: Exit.Exit<number, string>;
const s = (() => {
  switch (e._tag) {
    case "Failure":
      return "failed";
    case "Success":
      return String(e.value);
  }
})();
```

Effect:

```ts
import { Exit } from "effect";

declare const e: Exit.Exit<number, string>;
const s = Exit.match(e, {
  onFailure: () => "failed",
  onSuccess: (n) => String(n),
});
```

### `Effect.match`

Maps both channels of an `Effect` into a single success (typical `onFailure` / `onSuccess`); use it when you would otherwise branch on success vs error after running or simulating a typed outcome.

Vanilla:

```ts
type Out = { _tag: "ok"; v: number } | { _tag: "err"; e: string };
declare const o: Out;
const s = (() => {
  switch (o._tag) {
    case "ok":
      return o.v;
    case "err":
      return -1;
  }
})();
```

Effect:

```ts
import { Effect } from "effect";

declare const program: Effect.Effect<number, string>;
const handled = Effect.match(program, {
  onSuccess: (n) => n,
  onFailure: () => -1,
});
```

### `Effect.matchEffect`

Like `Effect.match` but each branch may return another `Effect`; use it when the handling path itself is effectful (logging, `Effect.gen`, services).

Vanilla:

```ts
// hypothetical imperative branches
type Action = { t: "log" } | { t: "skip" };
declare const a: Action;
const go = (() => {
  switch (a.t) {
    case "log":
      return 1;
    case "skip":
      return 0;
  }
})();
```

Effect:

```ts
import { Effect } from "effect";

declare const e: Effect.Effect<number, string, never>;
const next = Effect.matchEffect(e, {
  onSuccess: (n) => Effect.succeed(n * 2),
  onFailure: () => Effect.succeed(0),
});
```

### `Effect.matchCause`

Collapses an `Effect` by inspecting the full `Cause` on failure; use it when a plain error value is not enough and you need defects, interruptions, or cause-driven logic (instead of `switch`ing on a flattened code).

Vanilla:

```ts
type Row = { code: "fail" } | { code: "die" } | { code: "ok" };
declare const row: Row;
const s = (() => {
  switch (row.code) {
    case "fail":
      return "F";
    case "die":
      return "D";
    case "ok":
      return "K";
  }
})();
```

Effect:

```ts
import { Cause, Effect } from "effect";

declare const e: Effect.Effect<string, string, never>;
const flat = Effect.matchCause(e, {
  onSuccess: (s) => s,
  onFailure: (c) => Cause.squash(c),
});
```
