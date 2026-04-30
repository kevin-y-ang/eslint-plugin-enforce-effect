# `no-promise`

Disallow direct Promise APIs in favor of Effect-based abstractions.

## Why?

Teams adopting Effect often want a single async/error model. Using `Promise`
directly can bypass Effect helpers, tracing, interruption, and shared
conventions.

## Replacing `async` functions

These alterVanillas cover the `noAsync` message: express asynchronous work as `Effect` without declaring an `async` function.

### `Effect.gen`

Build an effect from a generator; use `yield*` to run nested effects, similar to `async`/`await` but in the `Effect` model.

Vanilla:

```ts
async function loadUser(id: string) {
  const res = await fetch(`/api/user/${id}`);
  return res.json() as Promise<{ name: string }>;
}
```

Effect:

```ts
import { Effect } from "effect";

const loadUser = (id: string) =>
  Effect.gen(function* () {
    const res = yield* Effect.promise(() => fetch(`/api/user/${id}`));
    return yield* Effect.tryPromise(() => res.json() as Promise<{ name: string }>);
  });
```

### `Effect.fn`

Return a function whose body is a generator: optional tracing, span naming, and pipeable post-processing on the result effect.

Vanilla:

```ts
async function greet(name: string) {
  const trimmed = name.trim();
  return `Hello, ${trimmed}`;
}
```

Effect:

```ts
import { Console, Effect } from "effect";

const greet = Effect.fn("greet")(function* (name: string) {
  yield* Console.log(`Greeting: ${name}`);
  const trimmed = name.trim();
  return `Hello, ${trimmed}`;
});
```

### `Effect.fnUntraced`

Same shape as `Effect.fn` for generator-backed functions, without the automatic tracing wrapper—use when spans would be noisy or redundant.

Vanilla:

```ts
export async function pureHelper(x: number) {
  return x * 2;
}
```

Effect:

```ts
import { Effect } from "effect";

export const pureHelper = Effect.fnUntraced(function* (x: number) {
  return x * 2;
});
```

### `Effect.suspend`

Defer construction of the inner `Effect` until the runtime runs it—useful when the next step depends on state or you need to re-evaluate a lazy/conditional body (similar to wrapping logic that would otherwise be inside `async`).

Vanilla:

```ts
async function loadFlag(enabled: boolean) {
  if (!enabled) return 0;
  return JSON.parse("42") as number;
}
```

Effect:

```ts
import { Effect } from "effect";

const loadFlag = (enabled: boolean) =>
  Effect.suspend(() =>
    enabled
      ? Effect.try({ try: () => JSON.parse("42") as number, catch: (e) => e as Error })
      : Effect.succeed(0),
  );
```

### `Effect.callback`

Model completion via a one-shot `resume` callback (and optional interrupt cleanup), matching APIs that are callback-based instead of `Promise`-returning.

Vanilla:

```ts
async function delay(ms: number) {
  await new Promise<void>((r) => setTimeout(r, ms));
}
```

Effect:

```ts
import { Effect } from "effect";

const delay = (ms: number) =>
  Effect.callback<void>((resume) => {
    const id = setTimeout(() => {
      resume(Effect.void);
    }, ms);
    return Effect.sync(() => clearTimeout(id));
  });
```

## Replacing `await`

These address the `noAwait` message: sequence asynchronous work with `Effect` instead of `await`.

### `yield*` (inside `Effect.gen`)

Inside `Effect.gen`, `yield*` runs another yieldable (typically an `Effect`) and binds its result— the direct analog to `await` for effects.

Vanilla:

```ts
async function sumIds(a: string, b: string) {
  const x = await readId(a);
  const y = await readId(b);
  return x + y;
}
```

Effect:

```ts
import { Effect } from "effect";

const readId = (id: string) => Effect.try({ try: () => Number(id), catch: (e) => e as Error });

const sumIds = (a: string, b: string) =>
  Effect.gen(function* () {
    const x = yield* readId(a);
    const y = yield* readId(b);
    return x + y;
  });
```

### `Effect.flatMap`

Sequence effects when the next step depends on the previous success value; like `then` for a single `Effect` chain.

Vanilla:

```ts
async function firstThenDouble() {
  const n = await Promise.resolve(21);
  return n * 2;
}
```

Effect:

```ts
import { Effect } from "effect";

const firstThenDouble = Effect.promise(() => Promise.resolve(21)).pipe(
  Effect.flatMap((n) => Effect.succeed(n * 2)),
);
```

### `Effect.andThen`

Run another effect (or a value lifted to an effect) after the current one succeeds; supports passing a plain `Effect` as the next step, not only a function.

Vanilla:

```ts
async function logThenDone() {
  await Promise.resolve(1);
  return "done";
}
```

Effect:

```ts
import { Console, Effect } from "effect";

const logThenDone = Effect.succeed(1).pipe(
  Effect.andThen(Console.log),
  Effect.andThen(Effect.succeed("done")),
);
```

### `Effect.fromYieldable`

Wrap a yieldable value (e.g. another `Effect` instance) for use in APIs that expect a plain `Effect`—use when bridging yieldables into a uniform combinator.

Vanilla:

```ts
async function useInner() {
  return await (async () => 7)();
}
```

Effect:

```ts
import { Effect } from "effect";

const inner = Effect.succeed(7);
const useInner = Effect.fromYieldable(inner);
```

## Replacing `new Promise(...)`

These cover the `noPromiseConstructor` message: represent deferred or Promise-backed work without the `Promise` constructor.

### `Effect.promise`

Lift a `Promise` factory into an `Effect` (with `AbortSignal` for interruption), when the async API already returns a `Promise`.

Vanilla:

```ts
const fromCtor = new Promise<string>((resolve) => {
  resolve("ok");
});
```

Effect:

```ts
import { Effect } from "effect";

const fromCtor = Effect.promise((signal) => {
  if (signal.aborted) return Promise.resolve("aborted");
  return Promise.resolve("ok");
});
```

### `Effect.tryPromise`

Like `Effect.promise` but map failures: uncaught rejections become typed errors (or `UnknownError` if you omit a `catch`).

Vanilla:

```ts
const risky = new Promise<number>((_, reject) => {
  reject(new Error("nope"));
});
```

Effect:

```ts
import { Effect } from "effect";

const risky = Effect.tryPromise({
  try: () => Promise.reject(new Error("nope")) as Promise<number>,
  catch: (e) => (e instanceof Error ? e : new Error(String(e))),
});
```

### `Effect.callback`

When control flow is expressed with a callback `resolve` (not `new Promise`), use `Effect.callback` so completion and cleanup stay in the `Effect` model.

Vanilla:

```ts
const manual = new Promise<void>((resolve) => {
  const t = setTimeout(() => resolve(), 10);
  void t;
});
```

Effect:

```ts
import { Effect } from "effect";

const manual = Effect.callback<void>((resume) => {
  const t = setTimeout(() => {
    resume(Effect.void);
  }, 10);
  return Effect.sync(() => clearTimeout(t));
});
```

### `Deferred.make`

A fiber-safe single-assignment cell: multiple waiters, one producer—use for hand-built coordination that would otherwise be written with a `new Promise` and shared `resolve`.

Vanilla:

```ts
const p = new Promise<string>((resolve) => {
  setTimeout(() => resolve("ready"), 5);
});
void p;
```

Effect:

```ts
import { Deferred, Effect } from "effect";

const program = Effect.gen(function* () {
  const deferred = yield* Deferred.make<string>();
  yield* Effect.sleep("5 millis").pipe(
    Effect.andThen(Deferred.succeed(deferred, "ready")),
    Effect.forkChild,
  );
  return yield* Deferred.await(deferred);
});
```

## Replacing `.then(...)`

These map to the `noPromiseChainThen` message: use `Effect` sequencing and mapping instead of `Promise.prototype.then`.

### `Effect.flatMap`

Vanilla
Chain a step that needs the previous value to produce a new `Effect`—analog to `then` with an async function returning a `Promise`.

Vanilla:

```ts
const doubled = Promise.resolve(3).then((n) => Promise.resolve(n * 2));
```

Effect:

```ts
import { Effect } from "effect";

const doubled = Effect.succeed(3).pipe(Effect.flatMap((n) => Effect.succeed(n * 2)));
```

### `Effect.andThen`

Vanilla
Follow one successful effect with another effect (or a constant `Effect`); similar to a `then` that returns another promise.

Vanilla:

```ts
const next = Promise.resolve("a").then(() => "b");
```

Effect:

```ts
import { Effect } from "effect";

const next = Effect.succeed("a").pipe(Effect.andThen(Effect.succeed("b")));
```

### `Effect.map`

Vanilla
Transform the success value without changing the error channel—like a synchronous `then` callback.

Vanilla:

```ts
const upper = Promise.resolve("hi").then((s) => s.toUpperCase());
```

Effect:

```ts
import { Effect } from "effect";

const upper = Effect.succeed("hi").pipe(Effect.map((s) => s.toUpperCase()));
```

### `Effect.tap`

Vanilla
Run a side effect on the success value and keep the original value, like `then` used only for logging or observability.

Vanilla:

```ts
const kept = Promise.resolve(10).then((n) => {
  console.log(n);
  return n;
});
```

Effect:

```ts
import { Console, Effect } from "effect";

const kept = Effect.succeed(10).pipe(Effect.tap(Console.log));
```

## Replacing `.catch(...)`

These address the `noPromiseChainCatch` message: recover from or inspect failures in the `Effect` error channel instead of `Promise#catch`.

### `Effect.catch`

Vanilla
Handle any recoverable error by supplying a fallback `Effect` (replaces Effect 3’s `Effect.catchAll`).

Vanilla:

```ts
const fixed = Promise.reject(new Error("x")).catch(() => 0);
```

Effect:

```ts
import { Effect } from "effect";

const fixed = Effect.fail(new Error("x")).pipe(Effect.catch(() => Effect.succeed(0)));
```

### `Effect.catchTag`

Vanilla
Narrow and handle errors that carry a readonly `_tag` discriminator.

Vanilla:

```ts
class E extends Error {
  readonly _tag = "E" as const;
}

const r = Promise.reject(new E()).catch((e) => (e instanceof E ? "ok" : Promise.reject(e)));
void r;
```

Effect:

```ts
import { Effect } from "effect";

class E extends Error {
  readonly _tag = "E" as const;
}

const r = Effect.fail(new E()).pipe(Effect.catchTag("E", () => Effect.succeed("ok" as const)));
void r;
```

### `Effect.catchTags`

Vanilla
Handle several tagged error variants in one call.

Vanilla:

```ts
const r = Promise.reject({ _tag: "A" } as const).catch(() => "handled");
void r;
```

Effect:

```ts
import { Effect } from "effect";

const r = Effect.fail({ _tag: "A" } as const).pipe(
  Effect.catchTags({ A: () => Effect.succeed("handled" as const) }),
);
void r;
```

### `Effect.catchCause`

Vanilla
Handle failures with access to the full `Cause` (e.g. interrupts, defects, or combined failures), not just the typed error.

Vanilla:

```ts
const c = Promise.reject(new Error("a")).catch((e) => (e as Error).message);
void c;
```

Effect:

```ts
import { Cause, Effect } from "effect";

const c = Effect.fail("a").pipe(Effect.catchCause((cause) => Effect.succeed(Cause.squash(cause))));
void c;
```

### `Effect.mapError`

Vanilla
Transform the error value without running a new effect, similar to a `catch` that only maps the rejection reason.

Vanilla:

```ts
const m = Promise.reject(1).catch((n: number) => n + 1);
void m;
```

Effect:

```ts
import { Effect } from "effect";

const m = Effect.fail(1).pipe(Effect.mapError((n) => n + 1));
void m;
```

### `Effect.match`

Vanilla
Branch on success and recoverable error in one step, returning a new success channel.

Vanilla:

```ts
const m = Promise.resolve(1).then(
  (n) => `ok:${n}`,
  (e: unknown) => `err:${e}`,
);
void m;
```

Effect:

```ts
import { Effect } from "effect";

const m = Effect.succeed(1).pipe(
  Effect.match({ onSuccess: (n) => `ok:${n}`, onFailure: (e) => `err:${e}` }),
);
void m;
```

### `Effect.matchEffect`

Vanilla
Like `Effect.match` but the handlers return `Effect`s when recovery needs further effectful work.

Vanilla:

```ts
const m = Promise.reject("bad").then(undefined, (e) => Promise.resolve(String(e).length));
void m;
```

Effect:

```ts
import { Effect } from "effect";

const m = Effect.fail("bad").pipe(
  Effect.matchEffect({
    onSuccess: (v) => Effect.succeed(v),
    onFailure: (e) => Effect.succeed(e.length),
  }),
);
void m;
```

### `Effect.matchCause`

Vanilla
Like `Effect.match` but failure receives `Cause` instead of the typed error only.

Vanilla:

```ts
const m = Promise.reject(new Error("x")).then(
  () => 0,
  (e) => (e instanceof Error ? e.message : "err"),
);
void m;
```

Effect:

```ts
import { Cause, Effect } from "effect";

const m = Effect.fail(new Error("x")).pipe(
  Effect.matchCause({
    onSuccess: (n) => n,
    onFailure: (cause) => `handled:${Cause.squash(cause)}`,
  }),
);
void m;
```

Vanilla

### `Effect.tapError`

Run a side effect when the effect fails, leaving the error unchanged (observability / logging).

Vanilla:

```ts
const t = Promise.reject(1).catch((e) => {
  console.error(e);
  return Promise.reject(e);
});
void t;
```

Effect:

```ts
import { Console, Effect } from "effect";

const t = Effect.fail(1).pipe(Effect.tapError(Console.log));
void t;
```

Vanilla

### `Effect.catchIf`

Recover only when a predicate or refinement matches the error.

Vanilla:

```ts
const c = Promise.reject(404).catch((n) => (n === 404 ? "nf" : Promise.reject(n)));
void c;
```

Effect:

```ts
import { Effect } from "effect";

const c = Effect.fail(404).pipe(
  Effect.catchIf(
    (n) => n === 404,
    () => Effect.succeed("nf" as const),
  ),
);
void c;
```

Vanilla

### `Effect.catchDefect`

Recover from defects (unexpected throwables) in the defect channel, analogous to a narrow use of `catch` for non-standard failures.

Vanilla:

```ts
const c = Promise.resolve()
  .then(() => {
    throw new Error("defect");
  })
  .catch((e) => (e instanceof Error ? e.message : "unknown"));
void c;
```

Effect:

```ts
import { Effect } from "effect";

const boom = Effect.sync(() => {
  throw new Error("defect");
});

const c = boom.pipe(Effect.catchDefect((d) => Effect.succeed(String(d))));
void c;
```

## Replacing `Promise.*` static methods

These map to the `noPromiseStatic` message: use `Effect` constructors and collection/racing helpers instead of `Promise.all`, `Promise.race`, and similar.
Vanilla

### `Effect.all`

Run many effects and collect successes in tuple/array/struct form; with `{ mode: "result" }`, every child runs and you get per-item `Result` values (similar to `Promise.allSettled`).

Vanilla:

```ts
const settled = await Promise.allSettled([
  Promise.resolve(1),
  Promise.reject(2),
  Promise.resolve(3),
]);
```

Effect:

```ts
import { Effect } from "effect";

const settled = Effect.all([Effect.succeed(1), Effect.fail(2), Effect.succeed(3)], {
  mode: "result",
});
```

### `Effect.partition`

Run an effect per element and split failures from successes, always succeeding with a tuple of arrays.

Vanilla:

```ts
const nums = await Promise.all([1, 2, 3].map((n) => Promise.resolve(n * 2)));
void nums;
```

Effect:

```ts
import { Effect } from "effect";

const split = Effect.partition([1, 2, 3], (n) =>
  Vanilla2 === 0 ? Effect.fail(`even:${n}`) : Effect.succeed(n * 2),
);
void split;
```

### `Effect.race`

Run two effects concurrently; the first success wins and the other is interrupted (similar to `Promise.race` when both are competing successes).

Vanilla:

```ts
const w = await Promise.race([
  Promise.resolve("a"),
  new Promise((r) => setTimeout(() => r("b"), 10)),
]);
void w;
```

Effect:

```ts
import { Duration, Effect } from "effect";

const w = Effect.race(
  Effect.succeed("a" as const),
  Effect.delay(Effect.succeed("b" as const), Duration.millis(10)),
);
Vanilla;
```

### `Effect.raceFirst`

First completion (success or failure) wins, closer to the full `Promise.race` semantics for mixed outcomes.

Vanilla:

```ts
const w = await Promise.race([
  Promise.reject("a"),
  new Promise((r) => setTimeout(() => r("b"), 10)),
]);
void w;
```

Effect:

```ts
import { Effect } from "effect";

const w = Effect.raceFirst(Effect.fail("a"), Effect.sleep("10 millis").pipe(Effect.as("b")));
Vanilla;
```

### `Effect.raceAll`

Many-way race: first success among several effects wins.

Vanilla:

```ts
const w = await Promise.race(
  [100, 200, 50].map((ms) => new Promise((r) => setTimeout(() => r(ms), ms))),
);
void w;
```

Effect:

```ts
import { Effect } from "effect";
Vanilla;
const w = Effect.raceAll(
  [100, 200, 50].map((ms) => Effect.sleep(`${ms} millis`).pipe(Effect.as(ms))),
);
void w;
```

### `Effect.succeed` / `Effect.fail`

Build trivial effects: immediate success or recoverable failure (parallel to `Promise.resolve` / `Promise.reject` with typed errors).

Vanilla:

```ts
const ok = Promise.resolve({ ok: true });
const bad = Promise.reject(new Error("no"));
void ok;
void bad;
```

Effect:

```ts
import { Effect } from "effect";
Vanilla;
const ok = Effect.succeed({ ok: true } as const);
const bad = Effect.fail(new Error("no"));
void ok;
void bad;
```

### `Effect.try`

Wrap synchronous code that can throw, mapping the exception to the error channel (for static-method-style try/catch without Promises).

Vanilla:

```ts
const j = await Promise.resolve().then(() => JSON.parse("not json"));
void j;
```

Effect:

```ts
import { Effect } from "effect";

const j = Effect.try({ try: () => JSON.parse("not json") as unknown, catch: (e) => e as Error });
Vanilla;
```

### `Deferred.make`

(Also listed under `Promise` statics for coordination.) Create a `Deferred` as an `Effect` for async-style coordination without `Promise` constructors in user code.

Vanilla:

```ts
const [p, resolve] = (() => {
  let r: (v: string) => void;
  const p2 = new Promise<string>((res) => (r = res));
  return [p2, (v: string) => r(v)] as const;
})();
void p;
void resolve;
```

Effect:
Vanilla

```ts
import { Deferred, Effect } from "effect";

const program = Effect.gen(function* () {
  const d = yield* Deferred.make<string>();
  yield* Deferred.succeed(d, "done");
  return yield* Deferred.await(d);
});
void program;
```
