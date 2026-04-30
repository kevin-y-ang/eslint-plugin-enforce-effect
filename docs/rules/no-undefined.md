# `no-undefined`

Disallow JavaScript `undefined` values in favor of explicit absence models.

## Why?

Effect-oriented codebases often prefer absence to be represented explicitly with
domain types rather than with ambient `undefined` values.

## Primitives

### `Option.fromNullishOr`

Converts a value that may be `null` or `undefined` into an `Option`, mapping both
sentinels to `None` and wrapping any other value in `Some`—for bridging nullable
or JSON-shaped data into a single, composable option type.

Vanilla:

```ts
const dto: { label: string | null | undefined } = JSON.parse(jsonText) as {
  label: string | null | undefined;
};
const label: string | undefined = dto.label == null ? undefined : dto.label;
```

Effect:

```ts
import { Option } from "effect";

const dto: { label: string | null | undefined } = JSON.parse(jsonText) as {
  label: string | null | undefined;
};
const label = Option.fromNullishOr(dto.label);
```

### `Option.fromUndefinedOr`

Converts a value that may be `undefined` into an `Option` while keeping `null` as
a possible `Some` value—use when `undefined` is the only “missing” sentinel
(e.g. optional properties) but `null` is meaningful on the wire.

Vanilla:

```ts
type Config = { maxRetries?: number };
const readRetries = (c: Config): number | undefined => c.maxRetries;
```

Effect:

```ts
import { Option } from "effect";

type Config = { maxRetries?: number };
const readRetries = (c: Config) => Option.fromUndefinedOr(c.maxRetries);
```

### `Result`

Represents success or a typed, inspectable reason for failure with
`Result.succeed` and `Result.fail`—use when “absence” of a value should be
distinguished and explained (e.g. not found) instead of returning `undefined`.

Vanilla:

```ts
declare const users: Map<string, { id: string; name: string }>;

const findUser = (id: string): { id: string; name: string } | undefined => users.get(id);
```

Effect:

```ts
import { Result } from "effect";

declare const users: Map<string, { id: string; name: string }>;
type NotFound = { readonly _tag: "NotFound"; readonly id: string };

const findUser = (id: string): Result.Result<{ id: string; name: string }, NotFound> => {
  const u = users.get(id);
  return u ? Result.succeed(u) : Result.fail({ _tag: "NotFound", id });
};
```

### `Effect`

Carries a typed error channel (the `E` in `Effect<A, E, R>`) so “not found” and
other absence reasons flow through `Effect.fail`—use for async or effectful
lookups where `undefined` would drop the context of why a value is missing.

Vanilla:

```ts
declare const loadRow: (id: string) => Promise<{ id: string } | undefined>;

const run = async (id: string) => {
  const row: { id: string } | undefined = await loadRow(id);
  return row;
};
```

Effect:

```ts
import { Effect } from "effect";

declare const loadRow: (id: string) => Promise<{ id: string } | undefined>;
type NotFound = { readonly _tag: "NotFound"; readonly id: string };

const run = (id: string) =>
  Effect.gen(function* () {
    const row = yield* Effect.promise(() => loadRow(id));
    if (row === undefined) {
      return yield* Effect.fail({ _tag: "NotFound", id } satisfies NotFound);
    }
    return row;
  });
```

### `Schema.Option`

Describes a value of type `Option<A>` with shared encode/decode rules so optional
data round-trips through an explicit `Some`/`None` model instead of ad hoc
`undefined` at the boundary.

Vanilla:

```ts
const body = { author: undefined as string | undefined };
const json = JSON.stringify(body);
// author dropped or left inconsistent vs a typed “no value” on the wire
```

Effect:

```ts
import { Option, Schema } from "effect";

const Book = Schema.Struct({ author: Schema.Option(Schema.String) });
const model = { author: Option.none<string>() };
const wire = Schema.encodeUnknownSync(Book)(model);
const back = Schema.decodeUnknownSync(Book)(wire);
// `back.author` is Option<string> — no ambient undefined in the domain value
```

### `Schema.NullOr`

Schema combinator for `A | null` in the encoded (wire) shape—use for APIs that
use JSON `null` to mean “no value” without conflating it with
`undefined`/missing keys in your schema story.

Vanilla:

```ts
const input = JSON.parse('{"biography": null}') as { biography: string | null };
const bio: string | null = input.biography;
```

Effect:

```ts
import { Schema } from "effect";

const Person = Schema.Struct({ biography: Schema.NullOr(Schema.String) });
const p = Schema.decodeUnknownSync(Person)(JSON.parse('{"biography": null}') as unknown);
p.biography satisfies string | null;
```

### `Schema.UndefinedOr`

Schema combinator for `A | undefined` in the encoded shape—use when the wire
representation allows a field to be missing or `undefined` while still decoding
to a well-typed value.

Vanilla:

```ts
const input = JSON.parse("{}") as { nickname: string | undefined };
const name: string | undefined = input.nickname;
```

Effect:

```ts
import { Schema } from "effect";

const User = Schema.Struct({ nickname: Schema.UndefinedOr(Schema.String) });
const u = Schema.decodeUnknownSync(User)(JSON.parse("{}") as unknown);
u.nickname satisfies string | undefined;
```

### `Schema.NullishOr`

Schema combinator for `A | null | undefined` in the encoded shape—use when
inputs may use either JSON `null` or a missing/undefined field for “no value,”
and you want a single schema to accept both at the boundary.

Vanilla:

```ts
const input = { note: null as string | null | undefined };
const n: string | null | undefined = input.note;
```

Effect:

```ts
import { Schema } from "effect";

const Note = Schema.Struct({ note: Schema.NullishOr(Schema.String) });
const y = Schema.decodeUnknownSync(Note)({ note: null });
y.note satisfies string | null | undefined;
```
