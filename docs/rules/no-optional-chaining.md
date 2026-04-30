# `no-optional-chaining`

Disallow JavaScript optional chaining in favor of explicit branching.

## Why?

Effect-oriented codebases often prefer control flow to stay explicit so absence
checks and failure paths are visible in the program shape.

## Primitives

### `Option.fromNullishOr`

Converts a single possibly-nullish value to an `Option` (`null` and `undefined` map to `None`); use it at API boundaries and before further `Option` steps instead of relying on `?.` to drop through on the receiver.

Vanilla:

```ts
const str: string | null | undefined = "hi";
const len: number | undefined = str?.length;
```

Effect:

```ts
import { Option, pipe } from "effect";

const str: string | null | undefined = "hi";
const len: Option.Option<number> = pipe(
  Option.fromNullishOr(str),
  Option.map((s) => s.length),
);
```

### `Option.liftNullishOr`

Wraps a function whose return may be `null` or `undefined` so it returns an `Option` instead, so call sites can pipe or map the outcome without tacking on `?.` to the result.

Vanilla:

```ts
function idRow(_id: string): { cell: string } | undefined {
  return { cell: "x" };
}
const v = idRow("a")?.cell;
```

Effect:

```ts
import { Option, pipe } from "effect";

function idRow(_id: string): { cell: string } | undefined {
  return { cell: "x" };
}
const v = pipe(
  Option.liftNullishOr(idRow)("a"),
  Option.map((r) => r.cell),
);
```

### `Option.flatMap`

Binds a function that returns an `Option` after an `Option` success, so you thread dependent lookups as explicit `Option` steps instead of a single long `?.` chain.

Vanilla:

```ts
type U = { address?: { line?: { text?: string } } } | null;
const u: U = { address: { line: { text: "here" } } };
const t = u?.address?.line?.text;
```

Effect:

```ts
import { Option, pipe } from "effect";

type U = { address?: { line?: { text?: string } } } | null;
const u: U = { address: { line: { text: "here" } } };
const t = pipe(
  Option.fromNullishOr(u),
  Option.flatMap((x) => Option.fromNullishOr(x.address)),
  Option.flatMap((a) => Option.fromNullishOr(a.line)),
  Option.flatMap((l) => Option.fromNullishOr(l.text)),
);
```

### `Option.flatMapNullishOr`

Combines `flatMap` with `fromNullishOr`, so a callback can return a plain nullable value on each step; use it to replace multi-step `a?.b?.c` when each leg is a nullable value rather than a nested `Option`.

Vanilla:

```ts
type T = { b?: { c?: number } } | null;
const a: T = { b: { c: 1 } };
const n = a?.b?.c;
```

Effect:

```ts
import { Option, pipe } from "effect";

type T = { b?: { c?: number } } | null;
const a: T = { b: { c: 1 } };
const n = pipe(
  Option.fromNullishOr(a),
  Option.flatMapNullishOr((x) => x.b),
  Option.flatMapNullishOr((x) => x.c),
);
```

### `Option.map`

Maps over the inner value of a `Some` and preserves `None`; use it to transform a value once you are already in `Option` form (often after `fromNullishOr`), instead of `?.` on a nullable receiver for that step.

Vanilla:

```ts
const n: number | null | undefined = 1.25;
const s: string | undefined = n?.toFixed(2);
```

Effect:

```ts
import { Option, pipe } from "effect";

const n: number | null | undefined = 1.25;
const s: Option.Option<string> = pipe(
  Option.fromNullishOr(n),
  Option.map((x) => x.toFixed(2)),
);
```

### `Option.filterMap`

Applies a `Result`-returning filter and map in one pass (`Result.succeed` keeps a `Some`, `Result.failVoid` drops to `None`); use it when a nullable `?.` would hide a guard plus a transform.

Vanilla:

```ts
const n: number | null | undefined = 3;
const line = n?.toExponential(2);
```

Effect:

```ts
import { Option, Result } from "effect";

const n: number | null | undefined = 3;
const line: Option.Option<string> = Option.filterMap(Option.fromNullishOr(n), (v) =>
  v > 0 ? Result.succeed(v.toExponential(2)) : Result.failVoid,
);
```

### `Option.getOrElse`

Unwraps a `Some` or supplies a lazy default for `None`; use it to replace `??` after a chain where you have modeled absence with `Option` first.

Vanilla:

```ts
const book: { title?: string } | null = { title: "Dune" };
const title: string = book?.title ?? "untitled";
```

Effect:

```ts
import { Option, pipe } from "effect";

const book: { title?: string } | null = { title: "Dune" };
const title: string = Option.getOrElse(
  pipe(
    Option.fromNullishOr(book),
    Option.flatMapNullishOr((b) => b.title),
  ),
  () => "untitled",
);
```

### `Option.match`

Exhaustive branching on `None` vs `Some` with explicit arms; use it instead of mixing `?.`, ternaries, and nullish coalescing to name both outcomes.

Vanilla:

```ts
const n: number | null | undefined = 42;
const label: string = n?.toString() ?? "n/a";
```

Effect:

```ts
import { Option } from "effect";

const n: number | null | undefined = 42;
const label: string = Option.match(Option.fromNullishOr(n), {
  onNone: () => "n/a",
  onSome: (x) => x.toString(),
});
```

### `Option.gen`

Generator "do" notation: each `yield*` unwraps a `Some` and any `None` short-circuits; use it for long dependent paths you would otherwise spell as `a?.b?.c?.d`.

Vanilla:

```ts
const a: { b?: { c?: { d?: string } } } | null = { b: { c: { d: "ok" } } };
const z = a?.b?.c?.d;
```

Effect:

```ts
import { Option } from "effect";

const a: { b?: { c?: { d?: string } } } | null = { b: { c: { d: "ok" } } };
const z: Option.Option<string> = Option.gen(function* () {
  const a1 = yield* Option.fromNullishOr(a);
  const b1 = yield* Option.fromNullishOr(a1.b);
  const c1 = yield* Option.fromNullishOr(b1.c);
  return yield* Option.fromNullishOr(c1.d);
});
```

### `Record.get`

Returns an `Option` for a key present on a record; use it instead of `row?.[key]` when a row may be missing a cell for that key (and combine with `fromNullishOr` when the whole row is nullable).

Vanilla:

```ts
const key = "name";
const row: Record<string, string> | undefined = { name: "Ann" };
const cell: string | undefined = row?.[key];
```

Effect:

```ts
import { Option, pipe, Record } from "effect";

const key = "name";
const row: Record<string, string> | undefined = { name: "Ann" };
const cell: Option.Option<string> = pipe(
  Option.fromNullishOr(row),
  Option.flatMap((r) => Record.get(r, key)),
);
```

### `HashMap.get`

Looks up a key in a `HashMap` and returns an `Option`; use it in pipelines when you have an optional `HashMap` and want to avoid `m?.` plus an imperative lookup, mirroring an optional `Map` access.

Vanilla:

```ts
const m: Map<string, string> | undefined = new Map();
const v: string | undefined = m?.get("a");
```

Effect:

```ts
import { HashMap, Option, pipe } from "effect";

const m: HashMap.HashMap<string, string> | undefined = undefined;
const v: Option.Option<string> = pipe(
  Option.fromNullishOr(m),
  Option.flatMap((hm) => HashMap.get(hm, "a")),
);
```

### `Array.get`

Returns an `Option` for the element at an index, or `None` when the index is out of bounds; use it instead of `arr?.[i]` when the array may be `null`/`undefined` or the index may be invalid.

Vanilla:

```ts
const list: string[] | undefined = ["a"];
const first: string | undefined = list?.[0];
```

Effect:

```ts
import { Array, Option, pipe } from "effect";

const list: string[] | undefined = ["a"];
const first: Option.Option<string> = pipe(
  Option.fromNullishOr(list),
  Option.flatMap((xs) => Array.get(xs, 0)),
);
```
