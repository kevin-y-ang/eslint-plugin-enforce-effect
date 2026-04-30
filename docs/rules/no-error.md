# `no-error`

Disallow `Error` constructor calls and `Error` type references.

## Why?

Effect-oriented codebases often prefer domain-specific failure values and error
types over the ambient JavaScript `Error` constructor and the built-in `Error`
type.

## Primitives

### `Data.TaggedError`

Builds a class whose instances carry a readonly `_tag` and implement `Cause.YieldableError`, so failures work with `Effect.catchTag` / `Effect.catchTags` in discriminated-union style.

Vanilla:

```ts
function getUser(_id: string): never {
  throw new Error("user not found");
}
```

Effect:

```ts
import { Data, Effect } from "effect";

class NotFound extends Data.TaggedError("NotFound")<{
  readonly id: string;
}> {}

const program = Effect.gen(function* () {
  return yield* new NotFound({ id: "u1" });
});
```

### `Data.Error`

Builds a yieldable error class without a `_tag`; use for failures that do not need tag-based recovery (unlike `Data.TaggedError`).

Vanilla:

```ts
class HttpFailure extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`HTTP ${status}`);
    this.status = status;
  }
}
```

Effect:

```ts
import { Data, Effect } from "effect";

class HttpFailure extends Data.Error<{
  readonly status: number;
  readonly message: string;
}> {}

const program = Effect.gen(function* () {
  return yield* new HttpFailure({ status: 500, message: "Bad gateway" });
});
```

### `Schema.TaggedErrorClass`

Defines a **schema-backed** class with a `_tag` and validated fields, combining `Schema` encoding/decoding with yieldable, tagged errors.

Vanilla:

```ts
function failAuth(): void {
  throw new Error("E_AUTH: not allowed");
}
```

Effect:

```ts
import { Effect, Schema } from "effect";

class DomainFailure extends Schema.TaggedErrorClass<DomainFailure>()("DomainFailure", {
  code: Schema.String,
}) {}

const program = Effect.gen(function* () {
  return yield* new DomainFailure({ code: "E_AUTH" });
});
```

### `Schema.ErrorClass`

Defines a **schema-backed** yieldable error class (like `Data.Error` + `Schema` validation) without the `TaggedErrorClass` wiring; use when you need structured fields and codecs but not an extra tag union.

Vanilla:

```ts
type ParseFail = { field: string; reason: string };

function failConfig(p: ParseFail): never {
  throw new Error(`${p.field}: ${p.reason}`);
}
```

Effect:

```ts
import { Effect, Schema } from "effect";

class ConfigParseError extends Schema.ErrorClass<ConfigParseError>("ConfigParseError")({
  field: Schema.String,
  reason: Schema.String,
}) {}

const program = Effect.gen(function* () {
  return yield* new ConfigParseError({ field: "port", reason: "not a number" });
});
```

### `Cause.UnknownError`

Represents a failure whose original value is not statically known, wrapping the value as `Error` cause with tag `UnknownError`; use when turning arbitrary defects into a consistent yieldable error.

Vanilla:

```ts
function rethrow(defect: unknown): never {
  const err = new Error("unexpected", { cause: defect });
  throw err;
}
```

Effect:

```ts
import { Cause, Effect } from "effect";

const program = Effect.gen(function* () {
  const defect: unknown = { code: 42 };
  return yield* new Cause.UnknownError(defect, "unexpected value");
});
```

### `Cause.YieldableError`

Interface implemented by all built-in `Cause` error classes and by `Data.Error` / `Data.TaggedError` instances; use in types or APIs so callers pass Effect-Vanilla errors instead of the ambient `Error` class.

Vanilla:

```ts
function logFailure(err: Error): void {
  console.error(err.message);
}
```

Effect:

```ts
import { Cause } from "effect";

function toFailingEffect(e: Cause.YieldableError) {
  return e.asEffect();
}
```

### `Cause.NoSuchElementError`

Standard tagged error for “element absent” (similar to empty collections or failed lookups); use instead of a generic `Error` when no value exists.

Vanilla:

```ts
function first<T>(xs: readonly T[]): T {
  if (xs.length === 0) {
    throw new Error("empty collection");
  }
  return xs[0] as T;
}
```

Effect:

```ts
import { Cause, Effect } from "effect";

const program = Effect.gen(function* () {
  return yield* new Cause.NoSuchElementError("empty collection");
});
```

### `Cause.TimeoutError`

Tagged error for an operation that exceeded a time limit; use with timeouts instead of a plain “timeout” `Error`.

Vanilla:

```ts
function awaitReady(): void {
  throw new Error("deadline exceeded");
}
```

Effect:

```ts
import { Cause, Effect } from "effect";

const program = Effect.gen(function* () {
  return yield* new Cause.TimeoutError("deadline exceeded");
});
```

### `Cause.IllegalArgumentError`

Tagged error for invalid parameters or invariants; use for argument validation instead of a generic `Error`.

Vanilla:

```ts
function parsePort(s: string): number {
  const n = Number(s);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error("port must be a non-negative integer");
  }
  return n;
}
```

Effect:

```ts
import { Cause, Effect } from "effect";

const program = Effect.gen(function* () {
  return yield* new Cause.IllegalArgumentError("port must be a non-negative integer");
});
```

### `Cause.ExceededCapacityError`

Tagged error when a bounded buffer or resource cannot accept more work; use instead of a generic “full” or “capacity” `Error`.

Vanilla:

```ts
function push(_item: string): void {
  throw new Error("queue is full");
}
```

Effect:

```ts
import { Cause, Effect } from "effect";

const program = Effect.gen(function* () {
  return yield* new Cause.ExceededCapacityError("queue is full");
});
```
