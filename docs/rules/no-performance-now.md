# `no-performance-now`

Disallow `performance.now()` in favor of Effect's `Clock` service.

## Why?

`performance.now()` reads from the host's high-resolution monotonic clock.
That sounds fine for measuring elapsed time — until you try to test a code
path whose behavior depends on it, and discover the clock is ambient and
can't be replaced. Routing time reads through Effect's `Clock` service
makes them deterministic in tests (swap `TestClock` to advance time
explicitly), portable, and consistent with the rest of the timing
machinery (`Effect.sleep`, `Schedule`, `Effect.timed`).

This rule covers the common misuse — using `performance.now()` as a clock
to measure "elapsed time" or to make decisions based on "now". When you
genuinely need browser performance instrumentation (`PerformanceObserver`,
performance entries, etc.), prefer a dedicated wrapper service over ad hoc
calls and disable this rule with a justification.

## Primitives

### `Clock.currentTimeMillis`

`Effect<number>` that returns the current time as Unix epoch milliseconds
via the `Clock` service. Use whenever you would have used `performance.now()`
to grab a "start" / "end" timestamp.

Vanilla:

```ts
const start = performance.now();
doWork();
const elapsed = performance.now() - start;
```

Effect:

```ts
import { Clock, Effect } from "effect";

const program = Effect.gen(function* () {
  const start = yield* Clock.currentTimeMillis;
  yield* doWork;
  const elapsed = (yield* Clock.currentTimeMillis) - start;
  return elapsed;
});
```

### `Clock.currentTimeNanos`

`Effect<bigint>` that returns the current time as Unix epoch nanoseconds
via the `Clock` service. Use when millisecond resolution isn't enough —
for example, distributed tracing spans or microbenchmarks.

Vanilla:

```ts
const start = performance.now();
doWork();
const elapsedMs = performance.now() - start;
```

Effect:

```ts
import { Clock, Effect } from "effect";

const program = Effect.gen(function* () {
  const start = yield* Clock.currentTimeNanos;
  yield* doWork;
  const elapsedNanos = (yield* Clock.currentTimeNanos) - start;
  return elapsedNanos;
});
```

### `Clock.Clock` service (for sync access)

Yield the `Clock` service to call `currentTimeMillisUnsafe()` /
`currentTimeNanosUnsafe()` synchronously inside an `Effect.gen` (for
example inside a `pipe` callback that cannot `yield*`). This still routes
through the service, so `TestClock` overrides keep working.

Vanilla:

```ts
const stamp = performance.now();
```

Effect:

```ts
import { Clock, Effect } from "effect";

const program = Effect.gen(function* () {
  const clock = yield* Clock.Clock;
  return clock.currentTimeMillisUnsafe();
});
```

### `Effect.timed`

Wraps an effect so its result is paired with the elapsed `Duration`,
measured via `Clock`. Use instead of bracketing work with
`performance.now()` calls and a manual subtraction.

Vanilla:

```ts
const start = performance.now();
const result = await doWork();
const elapsedMs = performance.now() - start;
```

Effect:

```ts
import { Effect } from "effect";

const program = Effect.timed(doWork);
```

### `Effect.timedWith`

Like `Effect.timed`, but lets you supply the `Effect<number>` (or
`Effect<bigint>`) used to read the clock — useful when you want to pin
a specific `Clock` call (e.g. nanos) instead of the default.

Vanilla:

```ts
const start = performance.now();
const result = await doWork();
const elapsedMs = performance.now() - start;
```

Effect:

```ts
import { Clock, Effect } from "effect";

const program = Effect.timedWith(doWork, Clock.currentTimeMillis);
```
