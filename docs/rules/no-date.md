# `no-date`

Disallow `Date` constructor calls, `Date.now()` calls, and `Date` type
references in favor of Effect-based date and clock primitives.

## Why?

Effect-oriented codebases prefer the `DateTime` and `Clock` modules over the
ambient `Date` constructor, the static `Date.now()` method, and the built-in
`Date` type. `Clock` makes "now" testable and injectable (swap `TestClock` in
tests), and `DateTime` provides a richer immutable representation with
first-class time zone support, parsing helpers, and seamless interop with the
rest of the `Effect` ecosystem. Banning the type prevents `Date` values
received from third-party APIs or JSON deserialization from leaking deeper
into the codebase — convert them at the boundary with `DateTime.fromDateUnsafe`
instead.

## Replacing `new Date(...)`

These cover the `noDateConstructor` message: produce a point in time as an
Effect-native `DateTime` (or as raw timestamps via `Clock`) instead of
constructing a vanilla `Date`.

### `DateTime.now`

`Effect` that produces the current time as `DateTime.Utc` via the `Clock`
service. Use this whenever you need "now" inside an effect — it is testable
because the `Clock` can be replaced in tests.

Vanilla:

```ts
const now = new Date();
```

Effect:

```ts
import { DateTime, Effect } from "effect";

const program = Effect.gen(function* () {
  const now = yield* DateTime.now;
  return now;
});
```

### `DateTime.nowUnsafe`

Synchronous "now" backed by `Date.now()`. Bypasses the `Clock` service, so
prefer `DateTime.now` inside effects. Use this only when you genuinely need a
plain (non-effect) `DateTime.Utc` value at the call site.

Vanilla:

```ts
const now = new Date();
```

Effect:

```ts
import { DateTime } from "effect";

const now = DateTime.nowUnsafe();
```

### `DateTime.nowInCurrentZone`

`Effect` that produces a `DateTime.Zoned` using the current `CurrentTimeZone`
service. Use this when "now" must be expressed in a specific zone (e.g. for
display).

Vanilla:

```ts
const now = new Date();
```

Effect:

```ts
import { DateTime, Effect } from "effect";

const program = DateTime.withCurrentZoneNamed("Europe/London")(
  Effect.gen(function* () {
    const local = yield* DateTime.nowInCurrentZone;
    return local;
  }),
);
```

### `DateTime.make`

Construct a `DateTime` from a `DateTime`, a `Date`, epoch milliseconds, parts,
or a string parseable by `Date.parse`. Returns `Option.None` when the input is
invalid — use this when you cannot trust the input.

Vanilla:

```ts
const date = new Date("2024-01-01T00:00:00Z");
```

Effect:

```ts
import { DateTime } from "effect";

const date = DateTime.make("2024-01-01T00:00:00Z");
```

### `DateTime.makeUnsafe`

Same shape as `DateTime.make` but throws an `IllegalArgumentError` on invalid
input. Use when you statically know the input is valid (for example, a
constant literal).

Vanilla:

```ts
const newYear = new Date(2024, 0, 1);
```

Effect:

```ts
import { DateTime } from "effect";

const newYear = DateTime.makeUnsafe({ year: 2024, month: 1, day: 1 });
```

### `DateTime.fromDateUnsafe`

Convert an existing JavaScript `Date` you have received from the outside world
(e.g. third-party API, JSON deserialization) into a `DateTime.Utc`. Throws on
invalid `Date` instances.

Vanilla:

```ts
function process(date: Date) {
  const copy = new Date(date.getTime());
  return copy;
}
```

Effect:

```ts
import { DateTime } from "effect";

function process(date: Date) {
  return DateTime.fromDateUnsafe(date);
}
```

### `DateTime.makeZonedFromString`

Parse a zoned date-time string in Effect's documented format into
`Option<DateTime.Zoned>`. Use instead of `new Date(string)` when the input is
expected to carry zone information.

Vanilla:

```ts
const wallClock = new Date("2024-06-01T10:00:00+02:00");
```

Effect:

```ts
import { DateTime } from "effect";

const wallClock = DateTime.makeZonedFromString("2024-06-01T10:00:00+02:00[Europe/Berlin]");
```

### `Clock.currentTimeMillis`

`Effect<number>` that returns wall-clock time as Unix epoch milliseconds via
the `Clock` service. Use this when you need a scalar timestamp rather than a
full `DateTime` value.

Vanilla:

```ts
const millis = new Date().getTime();
```

Effect:

```ts
import { Clock, Effect } from "effect";

const program = Effect.gen(function* () {
  const millis = yield* Clock.currentTimeMillis;
  return millis;
});
```

### `Clock.currentTimeNanos`

`Effect<bigint>` that returns wall-clock time as Unix epoch nanoseconds via
the `Clock` service. Use this when you need higher-precision timestamps than
milliseconds.

Vanilla:

```ts
const millis = new Date().getTime();
```

Effect:

```ts
import { Clock, Effect } from "effect";

const program = Effect.gen(function* () {
  const nanos = yield* Clock.currentTimeNanos;
  return nanos;
});
```

## Replacing `Date.now()`

These cover the `noDateNow` message: read the current epoch timestamp through
the `Clock` service so it can be swapped for `TestClock` in tests, instead of
reaching for `Date.now()` directly.

### `Clock.currentTimeMillis`

`Effect<number>` that returns the current epoch milliseconds via the `Clock`
service. The drop-in replacement for `Date.now()` inside an `Effect.gen`.

Vanilla:

```ts
const elapsed = Date.now() - start;
```

Effect:

```ts
import { Clock, Effect } from "effect";

const program = Effect.gen(function* () {
  const millis = yield* Clock.currentTimeMillis;
  return millis - start;
});
```

### `Clock.currentTimeNanos`

`Effect<bigint>` that returns the current epoch nanoseconds via the `Clock`
service. Use when millisecond resolution is not enough (high-resolution
benchmarks, distributed-tracing spans, etc.).

Vanilla:

```ts
const stamp = Date.now();
```

Effect:

```ts
import { Clock, Effect } from "effect";

const program = Effect.gen(function* () {
  const nanos = yield* Clock.currentTimeNanos;
  return nanos;
});
```

### `Clock.Clock` service (for sync access)

When you need an unsafe synchronous read inside an Effect (e.g. inside a
`pipe` callback that cannot `yield*`), grab the `Clock` service first and
call `currentTimeMillisUnsafe()` / `currentTimeNanosUnsafe()` on it. This
still routes through the service, so `TestClock` overrides keep working.

Vanilla:

```ts
const stamp = Date.now();
```

Effect:

```ts
import { Clock, Effect } from "effect";

const program = Effect.gen(function* () {
  const clock = yield* Clock.Clock;
  return clock.currentTimeMillisUnsafe();
});
```

### `DateTime.now`

If what you actually want is "now" as a `DateTime.Utc` value (rather than raw
millis), use `DateTime.now`. It is implemented as
`Effect.map(Clock.currentTimeMillis, makeUtc)`, so it routes through `Clock`
the same way.

Vanilla:

```ts
const stamp = new Date(Date.now());
```

Effect:

```ts
import { DateTime, Effect } from "effect";

const program = Effect.gen(function* () {
  const stamp = yield* DateTime.now;
  return stamp;
});
```

### `DateTime.nowUnsafe`

For a sync, non-Effect call site that needs a `DateTime.Utc` value,
`DateTime.nowUnsafe()` is backed by `Date.now()`. It bypasses `Clock`, so
prefer `DateTime.now` or `Clock.currentTimeMillis` when you can sit inside an
`Effect`.

Vanilla:

```ts
const stamp = Date.now();
```

Effect:

```ts
import { DateTime } from "effect";

const stamp = DateTime.nowUnsafe();
```

## Replacing the `Date` type

These cover the `noDateType` message: type signatures, parameters, return
types, and unions should reference Effect's `DateTime` types instead of the
ambient `Date` interface.

### `DateTime.DateTime`

The union of `DateTime.Utc | DateTime.Zoned`. Use this in signatures that
accept "any point in time" — accepting both the zone-aware and zone-naive
variants matches what most callers want.

Vanilla:

```ts
function logStamp(stamp: Date): void {
  console.log(stamp.toISOString());
}
```

Effect:

```ts
import { DateTime } from "effect";

function logStamp(stamp: DateTime.DateTime): void {
  console.log(DateTime.formatIso(stamp));
}
```

### `DateTime.Utc`

Use when the value is specifically a zone-naive UTC instant — for example, a
timestamp returned by `DateTime.now`, `DateTime.makeUnsafe`, or
`DateTime.fromDateUnsafe`.

Vanilla:

```ts
function ageOf(birth: Date): number {
  return Date.now() - birth.getTime();
}
```

Effect:

```ts
import { DateTime } from "effect";

function ageOf(birth: DateTime.Utc): number {
  return DateTime.distance(birth, DateTime.nowUnsafe());
}
```

### `DateTime.Zoned`

Use when the value is specifically a zoned point in time (carries a
`TimeZone`) — for example, values produced by `DateTime.makeZoned` or
`DateTime.nowInCurrentZone`.

Vanilla:

```ts
function formatLocal(stamp: Date): string {
  return stamp.toLocaleString();
}
```

Effect:

```ts
import { DateTime } from "effect";

function formatLocal(stamp: DateTime.Zoned): string {
  return DateTime.formatIsoZoned(stamp);
}
```
