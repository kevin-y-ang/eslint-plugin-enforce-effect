# `no-for`

Disallow JavaScript `for` loops in favor of explicit iteration helpers.

## Why?

Effect-oriented codebases often prefer iteration to be expressed with
combinators, traversals, and other explicit helpers instead of imperative loop
constructs.

## Primitives

### `Effect.forEach`

Runs an effect for each element of an iterable and collects results (or discards them with `discard: true`); use it for sequential (or `concurrency`-controlled) per-item effectful work instead of a loop that awaits or composes effects by hand.

Vanilla:

```ts
import { Effect } from "effect";

const seeds = [1, 2, 3] as const;
const doubled: number[] = [];
for (const n of seeds) {
  doubled.push(Effect.runSync(Effect.succeed(n * 2)));
}
void doubled;
```

Effect:

```ts
import { Effect } from "effect";

const program = Effect.forEach([1, 2, 3] as const, (n) => Effect.succeed(n * 2));
```

### `Effect.all`

Turns a collection of `Effect` values (iterable or record of effects) into one `Effect` that runs them and combines outputs; use it when a `for` loop is only there to build an array of effects to run together.

Vanilla:

```ts
import { Effect } from "effect";

const fetches: Array<Effect.Effect<string>> = [];
for (const n of [1, 2, 3]) {
  fetches.push(Effect.succeed(`chunk-${n}`));
}
const combined = Effect.all(fetches);
void combined;
```

Effect:

```ts
import { Effect } from "effect";

const parts = [1, 2, 3] as const;
const combined = Effect.all(parts.map((n) => Effect.succeed(`chunk-${n}`)));
```

### `Effect.whileLoop`

Repeats a body `Effect` on each iteration and runs an imperative `step` for its result while a `while` guard stays true; use it in place of `while` / `for` loops that interleave state updates with effectful steps.

Vanilla:

```ts
let n = 0;
while (n < 3) {
  n += 1;
}
void n;
```

Effect:

```ts
import { Effect } from "effect";

let n = 0;
const program = Effect.whileLoop({
  while: () => n < 3,
  body: () => Effect.sync(() => ++n),
  step: () => {},
});
```

### `Stream.fromIterable` + `Stream.runForEach`

Lifts an iterable to a `Stream` and then runs an effect for each element, materializing the stream; use it when you would `for...of` over a list to perform a side effect per item with Stream back-pressure semantics.

Vanilla:

```ts
import { Console, Effect } from "effect";

const lines = ["a", "b", "c"];
for (const line of lines) {
  Effect.runSync(Console.log(`line: ${line}`));
}
```

Effect:

```ts
import { Stream, Console, Effect } from "effect";

const program = Stream.runForEach(Stream.fromIterable(["a", "b", "c"]), (line) =>
  Console.log(`line: ${line}`),
);
void Effect.runPromise(program);
```

### `Stream.fromIterable` + `Stream.mapEffect`

Turns an iterable into a `Stream` and maps each item through an `Effect` (optionally with concurrency), producing a new stream; use it instead of a loop that async-transforms each input into the next value.

Vanilla:

```ts
void (async () => {
  const loadDouble = (n: number) => Promise.resolve(n * 2);
  const input = [1, 2, 3];
  const output: number[] = [];
  for (const n of input) {
    output.push(await loadDouble(n));
  }
})();
```

Effect:

```ts
import { Stream, Effect } from "effect";

const program = Stream.fromIterable([1, 2, 3] as const).pipe(
  Stream.mapEffect((n) => Effect.promise(() => Promise.resolve(n * 2))),
  Stream.runCollect,
);
void Effect.runPromise(program);
```

### `Array.map`

Maps each array element to a new value with a pure function; use it for fixed-size transforms instead of a `for` loop that writes into a new array.

Vanilla:

```ts
const src = [1, 2, 3];
const dst: number[] = [];
for (let i = 0; i < src.length; i += 1) {
  dst.push(src[i]! * 2);
}
```

Effect:

```ts
import { Array } from "effect";

const dst = Array.map([1, 2, 3] as const, (n) => n * 2);
```

### `Array.reduce`

Folds an iterable from left to right with an accumulator; use it instead of a `for` loop that mutates a running `acc`.

Vanilla:

```ts
const nums = [1, 2, 3, 4];
let sum = 0;
for (const n of nums) {
  sum += n;
}
```

Effect:

```ts
import { Array } from "effect";

const sum = Array.reduce([1, 2, 3, 4] as const, 0, (acc, n) => acc + n);
```

### `Iterable.map`

Lazily maps an `Iterable` without materializing a full array up front; use it instead of a `for...of` that pushes mapped values into a buffer.

Vanilla:

```ts
const src: Iterable<number> = [1, 2, 3];
const doubled: number[] = [];
for (const x of src) {
  doubled.push(x * 2);
}
```

Effect:

```ts
import { Iterable, Array } from "effect";

const doubled = Array.fromIterable(Iterable.map([1, 2, 3] as const, (x) => x * 2));
```

### `Record.collect`

Builds a new array from a record by visiting each key and value with a pure function; use it in place of `for...in` (with guards) to transform object entries.

Vanilla:

```ts
const config = { a: 1, b: 2 } as const;
const out: string[] = [];
for (const key in config) {
  if (Object.prototype.hasOwnProperty.call(config, key)) {
    out.push(`${key}=${(config as Record<string, number>)[key]}`);
  }
}
```

Effect:

```ts
import { Record } from "effect";

const out = Record.collect({ a: 1, b: 2 } as const, (key, n) => `${key}=${n}`);
```

### `Record.toEntries`

Returns a stable array of `[key, value]` pairs for a string-keyed record; use it when a `for...in` loop was only there to build entry tuples.

Vanilla:

```ts
const person = { name: "Ada", year: 1815 } as const;
const entries: Array<[keyof typeof person, number | string]> = [];
for (const k in person) {
  if (Object.prototype.hasOwnProperty.call(person, k)) {
    entries.push([k, person[k]]);
  }
}
```

Effect:

```ts
import { Record } from "effect";

const entries = Record.toEntries({ name: "Ada", year: 1815 } as const);
```

### `HashMap.forEach`

Invokes a side effect for every entry in a `HashMap` without allocating intermediate iterators; use it when you would `for...of` over map entries to consume them.

Vanilla:

```ts
import { HashMap } from "effect/HashMap";

const m = HashMap.make(["a", 1], ["b", 2]);
const acc: string[] = [];
for (const [k, v] of HashMap.entries(m)) {
  acc.push(`${k}:${v}`);
}
```

Effect:

```ts
import { HashMap } from "effect/HashMap";

const m = HashMap.make(["a", 1], ["b", 2]);
const acc: string[] = [];
HashMap.forEach(m, (v, k) => {
  acc.push(`${k}:${v}`);
});
```

### `Effect.repeat`

Runs an `Effect` again according to a `Schedule` (or schedule builder); use it for counted or timed repetition instead of a `for` counter loop around the same effect.

Vanilla:

```ts
import { Console, Effect } from "effect";

for (let i = 0; i < 3; i += 1) {
  Effect.runSync(Console.log("tick"));
}
```

Effect:

```ts
import { Effect, Console, Schedule } from "effect";

const program = Console.log("tick").pipe(Effect.repeat(Schedule.recurs(2)));
// Three runs: initial + two scheduled repetitions (pair with the `i < 3` loop above)
void Effect.runPromise(program);
```

### `Effect.forever`

Repeats the same `Effect` without terminating (optionally with `disableYield`); use it in place of `while (true)` or unbounded `for` loops for endless polling or heartbeats.
Vanilla
Vanilla:

```ts
import { Console, Effect } from "effect";

while (true) {
  Effect.runSync(Console.log("heartbeat"));
  break;
}
```

Effect:

```ts
import { Console, Effect } from "effect";

const program = Console.log("heartbeat").pipe(Effect.forever());
// Interrupt the fiber to stop, e.g. Effect.runFork(program)
```
