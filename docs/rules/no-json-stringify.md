# `no-json-stringify`

Disallow `JSON.stringify` in favor of validated encoding via `Schema`.

## Why?

`JSON.stringify(value)` happily serializes anything you give it — a value
typed as `T` may contain `unknown` fields, drifted shape, or values that no
longer round-trip with the schema you decode with on the other side. Effect's
`Schema` encodes through the same definition you decode with, so the wire
format is enforced at both ends, transformations (e.g. `Date` ↔ ISO string)
are applied symmetrically, and encoding errors surface as typed failures
instead of silently producing the wrong payload.

If you genuinely just want a string of an already-validated value (logs,
debug output), prefer the encoding helpers below or `Schema.toJsonString`
instead of `JSON.stringify`.

## Primitives

### `Schema.encode`

`(input) => Effect<Output, ParseIssue>` that encodes a decoded value back to
the schema's encoded representation. Use when encoding can fail (for example,
schemas with refinements or transformations that may reject the input).

Vanilla:

```ts
const payload = JSON.stringify(person);
```

Effect:

```ts
import { Effect, Schema } from "effect";

const Person = Schema.Struct({
  name: Schema.String,
  age: Schema.Number,
});

const program = Effect.gen(function* () {
  const encoded = yield* Schema.encode(Person)(person);
  return JSON.stringify(encoded);
});
```

### `Schema.encodeSync`

Synchronous variant: `(input) => Output`, throws on encode failure. Use when
you statically know the input matches the schema.

Vanilla:

```ts
const payload = JSON.stringify(person);
```

Effect:

```ts
import { Schema } from "effect";

const Person = Schema.Struct({
  name: Schema.String,
  age: Schema.Number,
});

const encoded = Schema.encodeSync(Person)(person);
```

### `Schema.encodeUnknown` / `Schema.encodeUnknownSync`

Like `encode` / `encodeSync`, but accept `unknown` and validate first. Use at
boundaries where the input has not been narrowed to the schema's input type
yet.

Vanilla:

```ts
function serialize(input: unknown): string {
  return JSON.stringify(input);
}
```

Effect:

```ts
import { Effect, Schema } from "effect";

const Person = Schema.Struct({
  name: Schema.String,
  age: Schema.Number,
});

const program = (input: unknown) =>
  Effect.gen(function* () {
    const encoded = yield* Schema.encodeUnknown(Person)(input);
    return encoded;
  });
```

### `Schema.encodeOption` / `Schema.encodeEither`

Non-effectful variants that return `Option<Output>` or `Either<Output, ParseIssue>`.
Use when you want the encode failure as a value rather than an `Effect`.

Vanilla:

```ts
let payload: string | undefined;
try {
  payload = JSON.stringify(person);
} catch {
  payload = undefined;
}
```

Effect:

```ts
import { Schema } from "effect";

const Person = Schema.Struct({
  name: Schema.String,
  age: Schema.Number,
});

const result = Schema.encodeEither(Person)(person);
```

### `Schema.toJsonString`

Builds a schema that encodes through the wrapped schema and then JSON
stringifies the result. Use to express "this value, as a JSON string" as a
single schema rather than chaining `encode` + `JSON.stringify` by hand.

Vanilla:

```ts
const payload = JSON.stringify(person);
```

Effect:

```ts
import { Effect, Schema } from "effect";

const Person = Schema.Struct({
  name: Schema.String,
  age: Schema.Number,
});
const PersonAsJson = Schema.toJsonString(Person);

const program = Effect.gen(function* () {
  const payload = yield* Schema.encode(PersonAsJson)(person);
  return payload;
});
```

### `Schema.encodeToJsonString`

Convenience helper that combines encoding with JSON stringification in one
step. Use when you want a JSON string out at the call site.

Vanilla:

```ts
const payload = JSON.stringify(person);
```

Effect:

```ts
import { Effect, Schema } from "effect";

const Person = Schema.Struct({
  name: Schema.String,
  age: Schema.Number,
});

const program = Effect.gen(function* () {
  const payload = yield* Schema.encodeToJsonString(Person)(person);
  return payload;
});
```
