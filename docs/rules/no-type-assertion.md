# `no-type-assertion`

Disallow TypeScript type assertions in favor of validated narrowing.

## Why?

Effect-oriented codebases usually prefer runtime validation, schema decoding,
and explicit narrowing over unchecked assertions that can hide invalid data.

## Primitives

### `Schema.decodeUnknownEffect`

Run schema decoding as an `Effect` so failures stay in the type system; use it when unknown input is validated inside `Effect` programs, generators, or pipelines.

Vanilla:

```ts
const body: unknown = JSON.parse('{"id":1,"name":"x"}');
const user = body as { id: number; name: string };
```

Effect:

```ts
import { Effect, Schema } from "effect";

const body: unknown = JSON.parse('{"id":1,"name":"x"}');
const User = Schema.Struct({ id: Schema.Int, name: Schema.String });
const program = Effect.gen(function* () {
  const user = yield* Schema.decodeUnknownEffect(User)(body);
  return `Hello, ${user.name}`;
});
```

### `Schema.decodeUnknownSync`

Decode unknown input synchronously at a boundary, throwing a `SchemaError` on invalid data when you are already in synchronous code and no `DecodingServices` are required.

Vanilla:

```ts
const config: unknown = JSON.parse('{"port":8080,"host":"localhost"}');
const c = config as { port: number; host: string };
```

Effect:

```ts
import { Schema } from "effect";

const Config = Schema.Struct({ port: Schema.Int, host: Schema.String });
const raw: unknown = JSON.parse('{"port":8080,"host":"localhost"}');
const c = Schema.decodeUnknownSync(Config)(raw);
```

### `Schema.decodeUnknownResult`

Decode to a `Result` so you can branch on success or failure without throwing or using `as` to fake success.

Vanilla:

```ts
const raw: unknown = JSON.parse("1");
const n = raw as number; // no failure path
```

Effect:

```ts
import { Result, Schema } from "effect";

const raw: unknown = JSON.parse("1");
const NumberFromString = Schema.NumberFromString;
const r = Schema.decodeUnknownResult(NumberFromString)(raw);
if (Result.isSuccess(r)) {
  const n = r.success;
}
```

### `Schema.is`

Build a type guard from a schema so you can narrow `unknown` (or a wider type) in `if` checks without a type assertion.

Vanilla:

```ts
function f(u: unknown) {
  if (u && typeof u === "object" && "name" in u) {
    return (u as { name: string }).name;
  }
}
```

Effect:

```ts
import { Schema } from "effect";

const Person = Schema.Struct({ name: Schema.String });
const isPerson = Schema.is(Person);
function f(u: unknown) {
  if (isPerson(u)) {
    return u.name;
  }
}
```

### `Schema.asserts`

Get an `asserts` function that both validates and narrows, suitable at boundaries where failure should be treated as a logic error.

Vanilla:

```ts
function assertString(u: unknown): asserts u is string {
  if (typeof u !== "string") {
    throw new TypeError("expected string");
  }
}
```

Effect:

```ts
import { Schema } from "effect";

const assertString: (u: unknown) => asserts u is string = Schema.asserts(Schema.String);
```

### `Schema.brand`

Add a nominal brand to a schema’s decoded type so values are not confused with the same structure under another name; combine with `decode*` or `make` to validate, not with `as`.

Vanilla:

```ts
type UserId = string & { readonly UserId: unique symbol };
const id = "abc" as UserId;
```

Effect:

```ts
import { Schema } from "effect";

const UserId = Schema.String.pipe(Schema.brand("UserId"));
const id = Schema.decodeUnknownSync(UserId)("abc");
```

### `Schema.fromBrand`

Wrap a `Brand.Constructor` so branded construction rules (including `Brand.check` filters) are part of the schema’s decode and `make` path.

Vanilla:

```ts
type Int = number & { __brand: "Int" };
const n = 3.5 as Int;
```

Effect:

```ts
import { Brand, Schema } from "effect";

type Int = number & Brand.Brand<"Int">;
const Int = Brand.check<Int>(Schema.isInt());
const IntFromNumber = Schema.Number.pipe(Schema.fromBrand("Int", Int));
const n = Schema.decodeUnknownSync(IntFromNumber)(1);
```

### `Schema.refine` and `.make()`

Narrow a schema’s TypeScript `Type` with a type-guard predicate and keep matching runtime checks; use `.make()` to construct a value through the same rules instead of casting.

Vanilla:

```ts
const n = -1 as 5; // “trust me”
```

Effect:

```ts
import { Schema } from "effect";

const Positive = Schema.Int.pipe(
  Schema.refine((n): n is number => n > 0, { expected: "positive" }),
);
const n = Positive.make(5);
```

### `Option.some<T>`

Represent a present optional value in the `Option` type so the rest of the pipeline knows the case without asserting.

Vanilla:

```ts
const n = 1;
const opt = n as import("effect").Option.Option<number>;
```

Effect:

```ts
import { Option } from "effect";

const n = 1;
const opt = Option.some(n);
```

### `Option.none<T>`

Represent absence in `Option` with a typed empty case, including a type argument on `Option.none` when the element type is otherwise ambiguous.

Vanilla:

```ts
const o = null as import("effect").Option.Option<string>;
```

Effect:

```ts
import { Option } from "effect";

const o = Option.none<string>();
```

### `identity<T>` (`effect/Function`)

The identity function; use `identity<Expected>(value)` so assignability to `Expected` is checked at compile time, unlike `as`.

Vanilla:

```ts
declare const w: string;
const lit = w as "a" | "b";
```

Effect:

```ts
import { identity } from "effect/Function";

const lit = identity<"a" | "b">("a");
```

### `Match.type` and `Match.exhaustive`

Build a type-safe pattern match over a union and use `Match.exhaustive` so the compiler rejects missing cases—no `as` to convince TypeScript a branch is complete.

Vanilla:

```ts
type Msg = { _tag: "A"; n: number } | { _tag: "B"; s: string };
function f(m: Msg) {
  if (m._tag === "A") return m.n * 2;
  return (m as { _tag: "B"; s: string }).s;
}
```

Effect:

```ts
import { Match } from "effect";

type Msg = { _tag: "A"; n: number } | { _tag: "B"; s: string };
const f = Match.type<Msg>().pipe(
  Match.when({ _tag: "A" }, (m) => m.n * 2),
  Match.when({ _tag: "B" }, (m) => m.s),
  Match.exhaustive,
);
```

### Generics and type parameters

Placing a type parameter on the function or type often removes the need to assert a generic argument or result.

Vanilla:

```ts
function box<T>(x: T): T {
  return x as any as T; // often used to "fix" inference
}
```

Effect:

```ts
function box<T>(x: T): T {
  return x;
}
const y = box<string>("hi");
```

### `Predicate.*`

Use built-in refinements such as `Predicate.isString`, `Predicate.isNumber`, and `Predicate.isBoolean` when you need a small runtime guard without a full schema.

Vanilla:

```ts
declare const u: unknown;
const a = u as string;
const b = u as number;
```

Effect:

```ts
import { Predicate } from "effect";

declare const u: unknown;
if (Predicate.isString(u)) {
  const s: string = u;
} else if (Predicate.isNumber(u)) {
  const n: number = u;
} else if (Predicate.isBoolean(u)) {
  const b: boolean = u;
}
```

### `Predicate.hasProperty`

Check for a property and narrow the value to a record with that key before reading it (data-first: `Predicate.hasProperty(self, property)`).

Vanilla:

```ts
declare const u: unknown;
if (u && typeof u === "object" && "id" in (u as object)) {
  const id = (u as { id: string }).id;
}
```

Effect:

```ts
import { Predicate } from "effect";

declare const u: unknown;
if (Predicate.hasProperty(u, "id")) {
  const id: unknown = u.id;
}
```

### `Predicate.isTagged`

Check `_tag` and narrow to that tag; combine with `hasProperty` when you also need other fields without asserting.

Vanilla:

```ts
declare const e: unknown;
if ((e as { _tag: string })._tag === "Err") {
  const code = (e as { _tag: "Err"; code: number }).code;
}
```

Effect:

```ts
import { Predicate } from "effect";

declare const e: unknown;
if (Predicate.isTagged(e, "Err") && Predicate.hasProperty(e, "code")) {
  const code: unknown = e.code;
}
```
