# `no-json-parse`

Disallow `JSON.parse` in favor of validated decoding.

## Why?

Effect-oriented codebases usually prefer JSON input to be decoded and validated
through explicit schemas rather than parsed directly into unchecked values.

## Primitives

### `Schema.fromJsonString`

Builds a schema that parses a JSON string and decodes the result with a given schema — use when you know the expected shape and want typed, validated values (and symmetric JSON string encoding when you need it).

Vanilla:

```ts
const input = '{"name":"Ada","age":36}';
// unsafe: no validation, inferred or explicit `unknown`
const parsed: unknown = JSON.parse(input);
```

Effect:

```ts
import { Schema } from "effect";

const input = '{"name":"Ada","age":36}';
const Person = Schema.Struct({
  name: Schema.String,
  age: Schema.Number,
});
const FromJson = Schema.fromJsonString(Person);

const person = Schema.decodeUnknownSync(FromJson)(input);
```

### `Schema.UnknownFromJsonString`

A schema that decodes a JSON-encoded string into `unknown`, failing decode when the string is not valid JSON — use when you want the same boundary as `JSON.parse` but wired into Schema decode/encode (for example before narrowing or applying another schema).

Vanilla:

```ts
const raw = '{"count":3,"ok":true}';
const value: unknown = JSON.parse(raw);
```

Effect:

```ts
import { Schema } from "effect";

const raw = '{"count":3,"ok":true}';
const value: unknown = Schema.decodeUnknownSync(Schema.UnknownFromJsonString)(raw);
```
