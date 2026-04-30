# `no-throw`

Disallow JavaScript `throw` statements in favor of Effect-based failure
channels.

## Why?

Effect-oriented codebases typically want failure to be modeled explicitly in
values instead of being raised as an exception. `throw` makes failure implicit
and bypasses the Effect error channel.

## Primitives

### `Effect.fail`

Create an `Effect` that fails with a typed, recoverable error in the error channel when you know the error value up front and want it handled like any other `E`.

Vanilla:

```ts
class NotFound extends Error {
  readonly _tag = "NotFound" as const;
}

function getRow(id: string) {
  throw new NotFound(`row ${id}`);
}
```

Effect:

```ts
import { Data, Effect } from "effect";

class NotFound extends Data.TaggedError("NotFound")<{ readonly id: string }> {}

const getRow = (id: string) => Effect.fail(new NotFound({ id }));
```

### `Effect.failSync`

Create a failing `Effect` when the error value should be produced lazily (e.g. timestamps or expensive construction) at the time the effect runs, not when the `Effect` value is created.

Vanilla:

```ts
function connectOrThrow(isConnected: boolean) {
  if (!isConnected) {
    const when = new Date().toISOString();
    throw new Error(`not connected, ${when}`);
  }
  return;
}
```

Effect:

```ts
import { Effect } from "effect";

const connectOrFail = (isConnected: boolean) =>
  isConnected
    ? Effect.void
    : Effect.failSync(() => new Error(`not connected, ${new Date().toISOString()}`));
```

### `Effect.failCause`

Create a failing `Effect` from an existing `Cause` (including composed or structured reasons) instead of a plain `E`, for example when reusing a `Cause` from a prior `Exit` or when failure is already represented as `Cause`.

Vanilla:

```ts
function rethrowChained(cause: unknown): never {
  const err = new Error("request failed");
  (err as Error & { cause?: unknown }).cause = cause;
  throw err;
}
```

Effect:

```ts
import { Cause, Effect } from "effect";

const fromPriorMessage = (message: string) => {
  const c = Cause.fail(new Error(message));
  return Effect.failCause(c);
};
```

### `Effect.failCauseSync`

Create a failing `Effect` when the `Cause` should be built lazily at execution time, similar to `failSync` but for a `Cause` instead of a bare error.

Vanilla:

```ts
function mustRollBack(stale: boolean) {
  if (stale) {
    const at = Date.now();
    throw new Error(`rolled back at ${at}`);
  }
  return "ok";
}
```

Effect:

```ts
import { Cause, Effect } from "effect";

const onStale = (stale: boolean) =>
  stale
    ? Effect.failCauseSync(() => Cause.fail(`rolled back at ${Date.now()}`))
    : Effect.succeed("ok" as const);
```

### `Effect.die`

Create an `Effect` that fails as a defect (untyped “die” in the `Cause`) when a condition is a bug or should not be treated as a normal `E` in the error channel.

Vanilla:

```ts
function div(a: number, b: number): number {
  if (b === 0) {
    throw new Error("invariant: divisor must be non-zero");
  }
  return a / b;
}
```

Effect:

```ts
import { Effect } from "effect";

const div = (a: number, b: number) =>
  b === 0 ? Effect.die(new Error("invariant: divisor must be non-zero")) : Effect.succeed(a / b);
```

### `Effect.interrupt`

An `Effect` that fails immediately with interruption (like a fiber interrupted for cancellation) when you need to model cooperative cancellation the same way runtime interruption does.

Vanilla:

```ts
function doWork(mustStop: boolean) {
  if (mustStop) {
    throw new Error("interrupted");
  }
  return "done";
}
```

Effect:

```ts
import { Effect } from "effect";

const doWork = (mustStop: boolean) =>
  Effect.gen(function* () {
    if (mustStop) {
      return yield* Effect.interrupt;
    }
    return yield* Effect.succeed("done" as const);
  });
```

### `Cause.fail`

Construct a `Cause` with a single typed failure when building failure values directly for `Effect.failCause`, APIs that take `Cause`, or composing reasons without running an `Effect` yet.

Vanilla:

```ts
function validate(ok: boolean) {
  if (!ok) {
    const message = "validation failed";
    throw new Error(message);
  }
  return "ok";
}
```

Effect:

```ts
import { Cause, Effect } from "effect";

const message = "validation failed";
const cause = Cause.fail(message);
const program = Effect.failCause(cause);
```

### `Cause.die`

Construct a `Cause` with a single defect when you need a defect-style reason inside `Cause` (for example to pass to `Effect.failCause` or to combine with `Cause` utilities).

Vanilla:

```ts
function useNameLength(name: string | null) {
  if (name === null) {
    const bug = new TypeError("unexpected null");
    throw bug;
  }
  return name.length;
}
```

Effect:

```ts
import { Cause, Effect } from "effect";

const useNameLength = (name: string | null) => {
  if (name === null) {
    const cause = Cause.die(new TypeError("unexpected null"));
    return Effect.failCause(cause);
  }
  return Effect.succeed(name.length);
};
```
