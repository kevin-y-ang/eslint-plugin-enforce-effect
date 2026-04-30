# `no-timers`

Disallow `setTimeout`, `setInterval`, `queueMicrotask`, `setImmediate`, and
their `clear*` counterparts in favor of Effect-based scheduling.

## Why?

Native timer globals run outside of structured concurrency: they are not
interruptible, leak handles when the surrounding work is cancelled, race with
unrelated work, and can't be paused for tests. Effect's scheduling primitives
(`Effect.sleep`, `Schedule`, `Effect.fork`, `Fiber`) are interruptible by
construction, testable via `TestClock`, and compose with the rest of the
runtime — sleeps integrate with timeouts, retries, races, scopes, and supervised
fibers.

## Primitives

### `Effect.sleep`

`Effect<void>` that suspends for the given `Duration` via the `Clock` service
(testable with `TestClock`). The drop-in replacement for `setTimeout` when
the only goal is "wait then continue".

Vanilla:

```ts
await new Promise<void>((resolve) => setTimeout(resolve, 1000));
```

Effect:

```ts
import { Effect } from "effect";

const program = Effect.gen(function* () {
  yield* Effect.sleep("1 second");
});
```

### `Effect.delay`

Returns a new `Effect` that runs the given effect after waiting a `Duration`.
Use when you have an effect to run and want to delay its start.

Vanilla:

```ts
setTimeout(() => doWork(), 500);
```

Effect:

```ts
import { Effect } from "effect";

const program = Effect.delay(doWork, "500 millis");
```

### `Effect.repeat` + `Schedule`

Use a `Schedule` (`Schedule.fixed`, `Schedule.spaced`, `Schedule.exponential`,
`Schedule.recurs`, `Schedule.union`, etc.) with `Effect.repeat` instead of
`setInterval`. The schedule controls cadence, jitter, max retries, and stops
cleanly when the surrounding fiber is interrupted.

Vanilla:

```ts
const handle = setInterval(() => poll(), 5000);
// later
clearInterval(handle);
```

Effect:

```ts
import { Effect, Schedule } from "effect";

const program = Effect.repeat(poll, Schedule.fixed("5 seconds"));
```

### `Effect.schedule`

Like `Effect.repeat`, but returns the schedule's output instead of the
effect's. Use when you want to build a long-running, scheduled computation
inside another effect.

Vanilla:

```ts
setInterval(() => emitMetric(), 30_000);
```

Effect:

```ts
import { Effect, Schedule } from "effect";

const program = Effect.schedule(emitMetric, Schedule.spaced("30 seconds"));
```

### `Effect.fork` / `Effect.forkScoped` / `Effect.forkDaemon`

Run an effect on a background fiber. The forked fiber is owned by its
`Scope` (or by the runtime, for `forkDaemon`), so it is interrupted
automatically when the scope closes — no leaked timer handles, no orphaned
promises.

Vanilla:

```ts
let stopped = false;
const handle = setInterval(() => { if (!stopped) tick(); }, 1000);
// somewhere on shutdown:
stopped = true;
clearInterval(handle);
```

Effect:

```ts
import { Effect, Schedule } from "effect";

const program = Effect.gen(function* () {
  const fiber = yield* Effect.forkScoped(
    Effect.repeat(tick, Schedule.fixed("1 second")),
  );
  return fiber;
});
```

### `Fiber.interrupt`

Cancels a forked fiber cooperatively, releasing any resources it owns. Use
instead of stashing a `setInterval` handle and calling `clearInterval` later.

Vanilla:

```ts
const handle = setInterval(work, 1000);
clearInterval(handle);
```

Effect:

```ts
import { Effect, Fiber, Schedule } from "effect";

const program = Effect.gen(function* () {
  const fiber = yield* Effect.fork(
    Effect.repeat(work, Schedule.fixed("1 second")),
  );
  yield* Fiber.interrupt(fiber);
});
```

### `Effect.race` / `Effect.timeout`

Express "do X, but give up after a deadline" with `Effect.race` or
`Effect.timeout` instead of pairing a `setTimeout` with manual cleanup.

Vanilla:

```ts
const result = await Promise.race([
  doRequest(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), 5000),
  ),
]);
```

Effect:

```ts
import { Effect } from "effect";

const program = Effect.timeout(doRequest, "5 seconds");
```

### Replacing `queueMicrotask` / `setImmediate`

Use `Effect.yieldNow` (cooperative reschedule) when you need to break a tight
loop, or `Effect.fork` when you need to actually move work to another fiber.
Either keeps the work supervised by the Effect runtime.

Vanilla:

```ts
queueMicrotask(() => continueWork());
```

Effect:

```ts
import { Effect } from "effect";

const program = Effect.gen(function* () {
  yield* Effect.yieldNow;
  yield* continueWork;
});
```
