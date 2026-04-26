# `no-try`

Disallow JavaScript `try` blocks in favor of Effect-based error handling.

## Why?

Effect-based codebases usually want failures to flow through Effect values rather
than imperative exception handling. `try` blocks make that control flow implicit
and harder to compose consistently.

## Primitives

**Recovery** — turn thrown exceptions into typed effect failures, or handle failures on the `Effect` error channel without imperative `catch`.

### `Effect.try`

Lifts a synchronous computation that may throw into an `Effect`, mapping exceptions to the typed error channel with a `catch` function.

Vanilla:

```ts
function parseName(input: string): { name: string } {
  try {
    return JSON.parse(input) as { name: string };
  } catch (e) {
    throw e instanceof Error ? e : new Error(String(e));
  }
}
```

Effect:

```ts
import { Effect } from "effect";

const parseName = (input: string) =>
  Effect.try({
    try: () => JSON.parse(input) as { name: string },
    catch: (e) => (e instanceof Error ? e : new Error(String(e))),
  });
```

### `Effect.tryPromise`

Lifts a `Promise` (or async work) that may reject or throw into an `Effect`, optionally remapping the failure with a `catch` function.

Vanilla:

```ts
async function load(): Promise<string> {
  try {
    return await Promise.resolve("ok");
  } catch (e) {
    throw e;
  }
}
```

Effect:

```ts
import { Effect } from "effect";

const load = () =>
  Effect.tryPromise({
    try: () => Promise.resolve("ok"),
    catch: (e) => new Error(String(e)),
  });
```

### `Effect.catch`

Handles **every** recoverable error on an effect by running a fallback effect; in Effect 4.x this is the new name for the former `Effect.catchAll`.

Vanilla:

```ts
function work(): void {
  throw "transient";
}
function run() {
  try {
    work();
  } catch (e) {
    if (e === "transient") {
      return "recovered" as const;
    }
    throw e;
  }
}
```

Effect:

```ts
import { Effect } from "effect";

const task = Effect.fail("transient" as const);
const run = task.pipe(Effect.catch(() => Effect.succeed("recovered" as const)));
```

### `Effect.catchTag`

Vanilla
Recovers from a **single** tagged error (`_tag` discriminator) while leaving other error types unchanged.

Vanilla:

```ts
type E = { readonly _tag: "Net"; m: string };
function work(): never {
  throw { _tag: "Net", m: "down" } satisfies E;
}
function run() {
  try {
    return work();
  } catch (e) {
    if (e && typeof e === "object" && (e as E)._tag === "Net") {
      return `net:${(e as E).m}`;
    }
    throw e;
  }
}
```

Effect:

```ts
Vanilla { Effect } from "effect"

type E = { readonly _tag: "Net"; m: string }
const task = Effect.fail({ _tag: "Net" as const, m: "down" } satisfies E)
const out = Effect.catchTag(task, "Net", (e) => Effect.succeed(`net:${e.m}`))
```

### `Effect.catchTags`

Recovers from **several** tagged errors in one object of handlers, instead of chaining multiple `catchTag` calls.

Vanilla:

```ts
type E =
  | { readonly _tag: "ValidationError"; message: string }
  | { readonly _tag: "NetworkError"; code: number };
function work(): never {
  throw { _tag: "ValidationError", message: "invalid" } satisfies E;
}
function run() {
  try {
    return work();
  } catch (e) {
    const err = e as E;
    if (err._tag === "ValidationError") {
      return err.message;
    }
    if (err._tag === "NetworkError") {
      return `http:${err.code}`;
    }
    throw e;
  }
}
```

Effect:

Vanilla
import { Data, Effect } from "effect"

class ValidationError extends Data.TaggedError("ValidationError")<{ message: string }> {}
class NetworkError extends Data.TaggedError("NetworkError")<{ code: number }> {}

const program: Effect.Effect<string, ValidationError | NetworkError> = Effect.gen(
function* () {
yield* Effect.fail(new ValidationError({ message: "invalid" }))
return "ok"
},
)

const out = program.pipe(
Effect.catchTags({
ValidationError: (e) => Effect.succeed(e.message),
NetworkError: (e) => Effect.succeed(`http:${e.code}`),
}),
)

````

### `Effect.catchCause`

Recovers from **any** failure (including causes that involve defects) by inspecting `Cause` and returning a new effect; use when `Effect.catch` is not enough.

Vanilla:

```ts
function unsafe(): never {
  throw new Error("boom")
}
function wrap() {
  try {
    return unsafe()
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
Vanilla
````

Effect:

```ts
import { Cause, Console, Effect } from "effect";

const program = Effect.die("boom");
const recovered = program.pipe(
  Effect.catchCause((cause) =>
    Cause.hasDies(cause)
      ? Console.log("saw defect").pipe(Effect.as("recovered" as const))
      : Effect.succeed("other" as const),
  ),
);
```

**Finally-style cleanup** — run work after an effect finishes, whether it succeeds, fails, or is interrupted, similar to `finally` or `using`/`Symbol.dispose` patterns.

### `Effect.ensuring`

Runs a finalizer `Effect` after the main effect **completes** (success, failure, or interruption) when the main effect at least **started**; use for cleanup that does not need the exit value.

Vanilla:

```ts
Vanillafunction go(): Promise<number> {
  try {
    return await Promise.resolve(42)
  } finally {
    await Promise.resolve().then(() => {
      void "cleanup"
    })
  }
}
```

Effect:

```ts
import { Console, Effect } from "effect";

const task = Console.log("body").pipe(Effect.as(42));
const program = Effect.ensuring(task, Console.log("cleanup"));
```

### `Effect.onExit`

Like `ensuring`, but the finalizer receives the full `Exit` so you can branch on success vs failure and access the value or `Cause`.

Vanilla:

```ts
function run(): number {
  try {
Vanillaturn 42
  } finally {
    void "observe completion"
  }
}
```

Effect:

```ts
import { Console, Effect, Exit } from "effect";

const program = Effect.onExit(Effect.succeed(42), (exit) =>
  Exit.isSuccess(exit) ? Console.log(`ok:${exit.value}`) : Console.log("failed"),
);
```

### `Effect.scoped` + `Effect.acquireRelease`

Binds **scoped** resources: `acquireRelease` adds release to the current `Scope`, and `Effect.scoped` runs the child workflow and closes the scope so finalizers (release) run—like `using` for async-capable cleanup.

Vanilla:

```ts
interface R {
  n: number;
  [Symbol.dispose](): void;
}
function work(): void {
  const r: R = { n: 1, [Symbol.dispose]() {} };
  try {
    void r.n;
  } finally {
    r[Symbol.dispose]();
  }
}
```

Effect:

```ts
import { Console, Effect } from "effect";

const resource = Effect.acquireRelease(
  Console.log("acquire").pipe(Effect.as("resource" as const)),
  () => Console.log("release"),
);
const program = Effect.scoped(
  Effect.gen(function* () {
    const r = yield* resource;
    yield* Console.log(`use:${r}`);
    return r;
  }),
);
```
