# `no-null`

Disallow JavaScript `null` and TypeScript `null` types in favor of explicit
absence models.

## Why?

Effect-oriented codebases generally prefer absence and failure to be modeled
explicitly. `null` introduces another ambient sentinel value that is easy to
forget to handle.

## Primitives

### `Option.fromNullishOr`

Converts a value that may be `null` or `undefined` into an `Option`, treating
both sentinels as `None`—use it when bridging nullable APIs (including JSON) into
`Option`.

Vanilla:

```ts
const raw: string | null = JSON.parse("null");
const name: string | null = raw;
const label: string | null = raw == null ? null : raw;
```

Effect:

```ts
import { Option } from "effect";

const raw: string | null = JSON.parse("null");
const nameOpt: Option.Option<string> = Option.fromNullishOr(raw);
```

### `Option.fromNullOr`

Converts a value that may be `null` into an `Option`, treating only `null` as
`None` and leaving `undefined` as a valid `Some`—use it when the boundary
distinguishes “missing as `null`” from “`undefined` is meaningful”.

Vanilla:

```ts
declare function fetchField(): string | null | undefined;
const v = fetchField();
// Only `null` means missing; `undefined` is kept as a real value
const forLogic: string | null = v === null ? null : (v as string);
```

Effect:

```ts
import { Option } from "effect";

declare function fetchField(): string | null | undefined;
const v = fetchField();
const opt: Option.Option<string> = Option.fromNullOr(v);
```

### `Result`

Represents a synchronous success or a typed failure; use
`Result.succeed` / `Result.fail` (or `Result.fromNullishOr`) when “empty” should
carry a specific reason, not a bare `null`.

Vanilla:

```ts
type Row = { id: string; label: string | null };

function labelOrNull(row: Row): string | null {
  return row.label;
}
```

Effect:

```ts
import { Result } from "effect";

type Missing = { _tag: "MissingLabel" };
type Row = { id: string; label: string | null };

function labelResult(row: Row): Result.Result<string, Missing> {
  return Result.fromNullishOr(row.label, () => ({ _tag: "MissingLabel" }));
}
```

### `Effect`

Models async (or effectful) work with a typed error channel `E`; use
`Effect.fail` when absence or “not found” should be a typed, recoverable error
instead of returning `null` from a `Promise`.

Vanilla:

```ts
async function findById(id: string): Promise<string | null> {
  if (id === "missing") return null;
  return "item";
}
```

Effect:

```ts
import { Data, Effect } from "effect";

class NotFound extends Data.TaggedError("NotFound")<{ id: string }> {}

const findById = (id: string): Effect.Effect<string, NotFound> =>
  id === "missing" ? Effect.fail(new NotFound({ id })) : Effect.succeed("item");
```

### `Schema.Option`

A schema for `Option<A>` in its encoded form (e.g. a tagged `Some` / `None`
structure in JSON) so optional values are not represented as a bare `null` on
the wire when you own the format.

Vanilla:

```ts
const row = JSON.parse('{"value": null}') as { value: number | null };
const n: number | null = row.value;
```

Effect:

```ts
import { Option, Schema } from "effect";

const Value = Schema.Option(Schema.Number);
const none = Schema.decodeUnknownSync(Value)(Option.none());
const some = Schema.decodeUnknownSync(Value)(Option.some(1));
```

### `Schema.NullOr`

A schema whose encoded form is `S | null` (JSON `null` for absence); use it to
validate and map nullable fields at the wire format without `null` in your own
types once decoded.

Vanilla:

```ts
type Row = { title: string | null };
const raw: Row = JSON.parse('{"title":null}') as Row;
const title: string | null = raw.title;
```

Effect:

```ts
import { Schema } from "effect";

const Row = Schema.Struct({ title: Schema.NullOr(Schema.String) });
const row = Schema.decodeUnknownSync(Row)({ title: null });
```

### `Schema.UndefinedOr`

A schema whose encoded form is `S | undefined` (missing key or `undefined`);
use for optional fields instead of smuggling `null` and `undefined` under one
loose `string | null | undefined` type at the boundary.

Vanilla:

```ts
type Sloppy = { title: string | null | undefined };
const raw = JSON.parse('{"title":null}') as Sloppy;
const t: string | null | undefined = raw.title;
```

Effect:

```ts
import { Schema } from "effect";

const Row = Schema.Struct({ title: Schema.UndefinedOr(Schema.String) });
const row = Schema.decodeUnknownSync(Row)({});
```

Note: decode may reject `null` for `title` here: `Schema.UndefinedOr` is for
`undefined` / missing, not for JSON `null`. The contrast is a loose union with
`null` in your types vs a single sentinel on the wire.

### `Schema.NullishOr`

A schema whose encoded form is `S | null | undefined`, covering both JSON `null`
and omitted/undefined; use for loose external payloads before narrowing to a
stricter in-memory model.

Vanilla:

```ts
type Row = { note: string | null | undefined };
const raw: Row = { note: null };
const note: string | null | undefined = raw.note;
```

Effect:

```ts
import { Schema } from "effect";

const Row = Schema.Struct({ note: Schema.NullishOr(Schema.String) });
const row = Schema.decodeUnknownSync(Row)({ note: null });
```
