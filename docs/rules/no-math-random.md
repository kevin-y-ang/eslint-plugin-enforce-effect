# `no-math-random`

Disallow `Math.random()` in favor of Effect's `Random` service.

## Why?

`Math.random()` reads from a single ambient PRNG that the program cannot
control. That is hostile to tests (you cannot reproduce a "flaky" run), to
property-based testing (you cannot fix a seed), and to security-sensitive code
(it is not cryptographically strong). Effect-oriented codebases route
randomness through the `Random` service so it can be seeded, replaced with a
deterministic implementation in tests, or backed by a cryptographic source
when the use case demands it.

## Primitives

### `Random.next`

`Effect<number>` that yields the next pseudo-random `number` in `[0, 1)` via
the `Random` service. Drop-in replacement for `Math.random()` inside an
`Effect.gen`.

Vanilla:

```ts
const value = Math.random();
```

Effect:

```ts
import { Effect, Random } from "effect";

const program = Effect.gen(function* () {
  const value = yield* Random.next;
  return value;
});
```

### `Random.nextInt`

`Effect<number>` that yields the next pseudo-random integer. Use instead of
`Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)`.

Vanilla:

```ts
const id = Math.floor(Math.random() * 1_000_000);
```

Effect:

```ts
import { Effect, Random } from "effect";

const program = Effect.gen(function* () {
  const id = yield* Random.nextInt;
  return id;
});
```

### `Random.nextIntBetween`

`Effect<number>` that yields a pseudo-random integer in `[min, max)`. Use
instead of `min + Math.floor(Math.random() * (max - min))`.

Vanilla:

```ts
const dieRoll = 1 + Math.floor(Math.random() * 6);
```

Effect:

```ts
import { Effect, Random } from "effect";

const program = Effect.gen(function* () {
  const roll = yield* Random.nextIntBetween(1, 7);
  return roll;
});
```

### `Random.nextRange`

`Effect<number>` that yields a pseudo-random `number` in `[min, max)`. Use for
floats — for example, jittered backoff delays.

Vanilla:

```ts
const jitterMs = 100 + Math.random() * 50;
```

Effect:

```ts
import { Effect, Random } from "effect";

const program = Effect.gen(function* () {
  const jitterMs = yield* Random.nextRange(100, 150);
  return jitterMs;
});
```

### `Random.nextBoolean`

`Effect<boolean>` that flips a fair coin. Use instead of `Math.random() < 0.5`.

Vanilla:

```ts
const heads = Math.random() < 0.5;
```

Effect:

```ts
import { Effect, Random } from "effect";

const program = Effect.gen(function* () {
  const heads = yield* Random.nextBoolean;
  return heads;
});
```

### `Random.choice`

`Effect<A>` that picks a uniformly random element from a non-empty
collection. Use instead of indexing into an array with
`Math.floor(Math.random() * arr.length)`.

Vanilla:

```ts
const colors = ["red", "green", "blue"];
const pick = colors[Math.floor(Math.random() * colors.length)];
```

Effect:

```ts
import { Effect, Random } from "effect";

const program = Effect.gen(function* () {
  const pick = yield* Random.choice(["red", "green", "blue"] as const);
  return pick;
});
```

### `Random.shuffle`

`Effect<Array<A>>` that returns a shuffled copy of an iterable. Use instead
of hand-rolled Fisher–Yates over `Math.random()`.

Vanilla:

```ts
function shuffle<T>(xs: readonly T[]): T[] {
  const copy = [...xs];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}
```

Effect:

```ts
import { Effect, Random } from "effect";

const program = Effect.gen(function* () {
  const shuffled = yield* Random.shuffle([1, 2, 3, 4, 5]);
  return shuffled;
});
```

### `Random.Random` service tag

Yield the `Random` service to call its methods directly when you want a
non-Effect result inside an `Effect.gen`. This still routes through the
service, so a deterministic test layer keeps working.

Vanilla:

```ts
const value = Math.random();
```

Effect:

```ts
import { Effect, Random } from "effect";

const program = Effect.gen(function* () {
  const random = yield* Random.Random;
  return random.next;
});
```

### `Random.make` / `Random.withSeed`

Construct a deterministic `Random` from a seed (or wrap a program so a
specific seed is in scope). Use to make randomness reproducible — for tests,
property-based testing, or replayable simulations.

Vanilla:

```ts
// no equivalent: Math.random() can't be seeded
const value = Math.random();
```

Effect:

```ts
import { Effect, Random } from "effect";

const program = Effect.gen(function* () {
  const value = yield* Random.next;
  return value;
}).pipe(Random.withSeed(42));
```
