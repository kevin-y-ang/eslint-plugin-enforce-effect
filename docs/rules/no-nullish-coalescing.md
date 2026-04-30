# `no-nullish-coalescing`

Disallow JavaScript nullish coalescing in favor of explicit branching.

## Why?

Effect-oriented codebases often prefer absence and fallback behavior to be made
explicit instead of hidden behind `??`.

## Primitives

### `Option.getOrElse`

`Option.getOrElse` returns the `Some` value, or a lazily supplied default for `None`—use it instead of a single `??` when you are already in `Option` or can lift a nullable with `fromNullishOr` or similar.

Vanilla:

```ts
declare const userConfig: { title?: string } | undefined;
const title: string = userConfig?.title ?? "Untitled";
```

Effect:

```ts
import * as Option from "effect/Option";

declare const userConfig: { title?: string } | undefined;
const option = Option.fromNullishOr(userConfig?.title);
const title: string = Option.getOrElse(option, () => "Untitled");
```

### `Option.match`

`Option.match` handles `onNone` and `onSome` in one call—use it when the two outcomes are different (not a single default), instead of a `??` that papers over a separate branch you still need to express.

Vanilla:

```ts
declare const n: number | undefined;
const line: string = (n ?? 0) > 0 ? `${n} items` : "No items";
```

Effect:

```ts
import * as Option from "effect/Option";
import { pipe } from "effect";

declare const n: number | undefined;
const line = pipe(
  Option.fromUndefinedOr(n),
  Option.match({
    onNone: () => "No items",
    onSome: (c) => (c > 0 ? `${c} items` : "No items"),
  }),
);
```

### `Option.orElse`

`Option.orElse` tries another `Option` when the first is `None` (lazy)—use it for priority chains, instead of repeated `a ?? b ?? c` on nullable values.

Vanilla:

```ts
declare const primary: string | null;
declare const backup: string | undefined;
const label: string = primary ?? undefined ?? backup ?? "none";
```

Effect:

```ts
import * as Option from "effect/Option";
import { pipe } from "effect";

declare const primary: string | null;
declare const backup: string | undefined;
const label: string = pipe(
  Option.fromNullishOr(primary),
  Option.orElse(() => Option.fromNullishOr(backup)),
  Option.getOrElse(() => "none"),
);
```

### `Option.getOrNull`

`Option.getOrNull` turns `None` into `null` and unwraps `Some`—use it when a caller expects `A | null`, instead of normalizing with `value ?? null`.

Vanilla:

```ts
declare const s: string | null | undefined;
const out: string | null = s ?? null;
```

Effect:

```ts
import * as Option from "effect/Option";

declare const s: string | null | undefined;
const out: string | null = Option.getOrNull(Option.fromNullishOr(s));
```

### `Option.getOrUndefined`

`Option.getOrUndefined` turns `None` into `undefined` and unwraps `Some`—use it for optional property slots, instead of `x ?? undefined`.

Vanilla:

```ts
declare const s: string | null | undefined;
const z: string | undefined = s ?? undefined;
```

Effect:

```ts
import * as Option from "effect/Option";

declare const s: string | null | undefined;
const z: string | undefined = Option.getOrUndefined(Option.fromNullishOr(s));
```

### `Result.getOrElse`

`Result.getOrElse` returns the success value, or a fallback from the error—use it instead of unwrapping with `??` after encoding failure as `undefined` (or a loose union).

Vanilla:

```ts
type R = { _tag: "Success"; value: number } | { _tag: "Failure"; err: string };
declare const r: R;
const n: number = (r._tag === "Success" ? r.value : undefined) ?? 0;
```

Effect:

```ts
import * as Result from "effect/Result";

const r = Result.fail("unavailable" as const);
const n: number = Result.getOrElse(r, () => 0);
```

### `Result.match`

`Result.match` maps success and failure in one place—use it instead of combining `??` with ad‑hoc `if` on a hand-rolled union, when you need a single result from both channels.

Vanilla:
Vanilla

```ts
type R = { _tag: "Success"; value: number } | { _tag: "Failure"; err: string };
declare const r: R;
const msg: string =
  (r._tag === "Success" ? `n=${r.value}` : undefined) ??
  (r._tag === "Failure" ? `err: ${r.err}` : "unknown");
```

Effect:

```ts
import * as Result from "effect/Result";
import { pipe } from "effect";

const r = Result.succeed(42);
const msg: string = pipe(
  r,
  Result.match({
    onSuccess: (n) => `n=${n}`,
    onFailure: (e) => `err: ${e}`,
  }),
);
```
