# Effect Services & Layers — Lego-Block Architecture Guide

A practical guide to defining services in Effect and composing them into layers like
lego blocks, with an emphasis on:

- **Drawing clear boundaries** between services
- **Keeping `R` (requirements) minimal** so dependencies don't leak through your call sites
- **Capping each service at 0–5 dependencies**
- **Assembling everything once, at the program's edge,** into one big super-layer

Every claim and example here is grounded in the local Effect API reference cloned at
`.reference/effect/` (Effect `v4.0.0-beta.57`). File:line citations are included so you
can verify against source.

---

## 1. Mental model: `Layer<ROut, E, RIn>`

A `Layer` is a recipe for building services.

```46:57:.reference/effect/packages/effect/src/Layer.ts
 * A Layer<ROut, E, RIn> represents:
 * - ROut: The services this layer provides
 * - E: The possible errors during layer construction
 * - RIn: The services this layer requires as dependencies
 *
 * @since 2.0.0
 * @category models
 */
export interface Layer<in ROut, out E = never, out RIn = never> extends Variance<ROut, E, RIn>, Pipeable {
  build(memoMap: MemoMap, scope: Scope.Scope): Effect<Context.Context<ROut>, E, RIn>
```

The whole game is to compose smaller `Layer<X, E, RIn>` values into one final
`Layer<App, E, never>` you can hand to `Effect.runPromise`, `Layer.launch`, or
`ManagedRuntime.make`. **`RIn = never`** is what "fully wired" looks like.

There are *two* places dependencies can live:

| Dependency kind  | Lives in                              | Resolved when             |
| ---------------- | ------------------------------------- | ------------------------- |
| **Construction** | The layer's `RIn`                     | Once, when layer is built |
| **Call-time**    | Each method's return-type `R`         | Every invocation          |

The cardinal rule of this guide: **prefer construction-time dependencies**. They
flatten into one `RIn` you can satisfy with one `Layer.provide(...)` call. Call-time
dependencies leak into every consumer of your service.

---

## 2. Defining a service (Effect 4 style)

The reference uses **`Context.Service`** as the canonical service-key constructor —
*not* `Context.Tag` / `Context.GenericTag` / `Effect.Service` (those names from
older Effect 3 docs do not appear as exports in this tree).

```130:162:.reference/effect/packages/effect/src/Context.ts
export const Service: {
  <Identifier, Shape = Identifier>(key: string): Service<Identifier, Shape>
  <Self, Shape>(): <
    const Identifier extends string,
    E,
    R = Types.unassigned,
    Args extends ReadonlyArray<any> = never
  >(
    id: Identifier,
    options?: {
      readonly make: ((...args: Args) => Effect<Shape, E, R>) | Effect<Shape, E, R> | undefined
    } | undefined
  ) =>
    & ServiceClass<Self, Identifier, Shape>
```

### The recommended class pattern

```ts
import { Context, Effect, Layer } from "effect"

class Database extends Context.Service<Database, {
  readonly query: (sql: string) => Effect.Effect<ReadonlyArray<unknown>, DbError>
}>()("app/Database", {
  make: Effect.gen(function*() {
    const config = yield* Config         // construction-time dep
    const pool = yield* makePool(config) //   captured in closure
    return {
      query: (sql) => Effect.tryPromise({
        try: () => pool.query(sql),
        catch: (e) => new DbError({ cause: e })
      })
    }
  })
}) {
  static Live = Layer.effect(this, this.make)
}
```

The exact same shape appears in the reference's tests — note `static A = Layer.effect(this, this.make)` is the convention for promoting `make` into a `Layer`:

```6:24:.reference/effect/packages/effect/test/ExecutionPlan.test.ts
  class Service extends Context.Service<Service>()("Service", {
    make: Effect.succeed({
      stream: Stream.fail("A") as Stream.Stream<number, string>
    })
  }) {
    static A = Layer.effect(this, this.make)
```

### Why `Layer.effect` is the right hammer

`Layer.effect` constructs a layer from an `Effect` and **automatically strips
`Scope` from `RIn`**. Construction can use scoped resources (file handles,
sockets, timers) without leaking `Scope` into the layer's type signature:

```750:807:.reference/effect/packages/effect/src/Layer.ts
export const effect: {
  <I, S>(service: Context.Key<I, S>): <E, R>(
    effect: Effect<S, E, R>
  ) => Layer<I, E, Exclude<R, Scope.Scope>>
```

> Note: in Effect 4, `Layer.effect` *replaces* the old `Layer.scoped` from 3.x
> (per docstring at `Layer.ts:758`). One name, one job.

### When to use `Context.Reference` instead

A `Context.Reference` is a service with a **default value**, available everywhere
without explicit provision. Use it for ambient infrastructure that should never
require wiring at the call site (logger, console, clock, random).

```131:160:.reference/effect/packages/effect/src/Console.ts
export const Console: Context.Reference<Console> = effect.ConsoleRef
// ...
export const consoleWith = <A, E, R>(f: (console: Console) => Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
  core.withFiber((fiber) => f(fiber.getRef(Console)))
```

This is why `Console.assert(...)` returns `Effect<void>` — `R = never`. You don't
have to provide `Console` to use it.

---

## 3. The single most important pattern: capture-in-closure

This is the trick that keeps each method's `R` narrow. **Inside `Effect.gen`, yield
each dependency once and let the methods close over it.** The methods returned by
the generator do not need those dependencies in their own `R`.

```1712:1733:.reference/effect/packages/effect/src/Layer.ts
 * const counterLayer = Layer.effect(Counter)(Effect.gen(function*() {
 *   const ref = yield* Ref.make(0)
 *   return {
 *     count: 0,
 *     increment: Effect.fn("Counter.increment")(() =>
 *       Ref.update(ref, (n) => n + 1).pipe(
 *         Effect.flatMap(() => Ref.get(ref))
 *       )
 *     )
 *   }
 * }))
```

Notice: `increment` returns `Effect<number>` — **`R = never`**. The `Ref` lives
in a closure, not in the type. Every consumer who has `Counter` can call
`Counter.increment()` without re-providing the ref.

Apply the same trick to real services:

```ts
class UserService extends Context.Service<UserService, {
  readonly find: (id: string) => Effect.Effect<User, NotFound>
  readonly create: (input: NewUser) => Effect.Effect<User, ValidationError | DbError>
}>()("app/UserService", {
  make: Effect.gen(function*() {
    const db  = yield* Database
    const log = yield* Logger
    return {
      find: Effect.fn("UserService.find")((id: string) =>
        Effect.gen(function*() {
          yield* log.debug(`finding ${id}`)
          const rows = yield* db.query(`SELECT * FROM users WHERE id = $1`)
          return rows[0] ?? (yield* Effect.fail(new NotFound({ id })))
        })
      ),
      create: Effect.fn("UserService.create")((input) =>
        // ... uses db, log — both already captured
      )
    }
  })
}) {
  static Live = Layer.effect(this, this.make)
}
```

The resulting layer is `Layer<UserService, never, Database | Logger>` — exactly two
construction-time dependencies, and *zero call-time dependencies* on `find`/`create`.

This is the lego nub. Every other service plugs in the same way.

### Why use `Effect.fn` for methods?

`Effect.fn` adds a traced span (the string label becomes a span name) and infers
`R` from the generator's yielded effects:

```12857:12905:.reference/effect/packages/effect/src/Effect.ts
 * Creates an Effect-returning function without tracing.
 * ...
export const fnUntraced: fn.Untraced = internal.fnUntraced
// ...
 * Creates a traced function with an optional span name and `SpanOptionsNoTrace` that adds spans and stack frames, plus pipeable post-processing that receives the Effect and the original arguments.
 * ...
export const fn: fn.Traced & {
  (name: string, options?: SpanOptionsNoTrace): fn.Traced
} = internal.fn
```

Use `Effect.fn("Service.method")` for traceable methods, `Effect.fnUntraced` for
hot paths where the span overhead matters.

---

## 4. Drawing clear service boundaries

The Effect codebase consistently models services around a **single capability**.
Look at the surface areas:

| Service                              | Capability           | Public method count |
| ------------------------------------ | -------------------- | ------------------- |
| `Console` (`packages/effect/src/Console.ts`) | terminal IO  | ~10 fixed methods   |
| `Clock` (`Clock.ts`)                 | time / sleep         | 4                   |
| `Random` (`Random.ts`)               | RNG                  | small fixed set     |
| `HttpClient` (`unstable/http/HttpClient.ts`) | HTTP execute | 1 method + helpers  |
| `SqlClient` (`unstable/sql/SqlClient.ts`)    | sql + tx     | ~5                  |

### Boundary heuristics

1. **One responsibility per service.** A service is the type-level "I want to do X"
   capability. If you can't describe it with a single sentence, split it.
2. **No cross-cutting concerns inside a service.** Don't bake auth, retry, or
   transactions into your `UserService` — those are *layers around it* or separate
   services that compose.
3. **The methods of a service form an interface, not a god-object.** If two
   methods share zero state and zero dependencies, they probably belong to two
   services.
4. **Cap dependencies at 0–5.** If your `make` generator yields more than 5
   services, you have either:
   - a god-service that should be split, or
   - missing intermediate abstractions (e.g. `Database` should be one service,
     not 12 query helpers each yielding the pool).

The Effect 4 `SqlClient.make` is a good example of a single-capability service
that *constructs* against a couple of dependencies (`Reactivity`, an acquirer)
and exposes a small, cohesive surface:

```113:144:.reference/effect/packages/effect/src/unstable/sql/SqlClient.ts
export const make = Effect.fnUntraced(function*(options: SqlClient.MakeOptions) {
  const transactionService = options.transactionService ?? TransactionConnection(clientIdCounter++)
  const getConnection = Effect.flatMap(
    Effect.serviceOption(transactionService),
    Option.match({
      onNone: () => options.acquirer,
      onSome: ([conn]) => Effect.succeed(conn)
    })
  )
  // ...
  const reactivity = yield* Reactivity
  const client: SqlClient = Object.assign(
    Statement.make(getConnection, options.compiler, options.spanAttributes, options.transformRows),
```

---

## 5. Tricks for keeping `R` minimal

### 5.1 Capture, don't propagate

Already covered in §3. This is the #1 trick. If a method's `R` includes a tag,
that tag is a viral demand on every caller.

### 5.2 `Exclude<R, Tag>` to strip self-provided requirements

When a service *provides* something for an inner block, strip that tag from the
inner block's `R` so callers don't see it leak. Effect's own combinators
demonstrate this exhaustively:

`Effect.withSpan` strips `ParentSpan`:

```7847:7861:.reference/effect/packages/effect/src/Effect.ts
export const withSpan: {
  <Args extends ReadonlyArray<any>>(
    name: string,
    options?:
      | SpanOptionsNoTrace
      | ((...args: NoInfer<Args>) => SpanOptionsNoTrace)
      | undefined,
    traceOptions?: TraceOptions | undefined
  ): <A, E, R>(self: Effect<A, E, R>, ...args: Args) => Effect<A, E, Exclude<R, ParentSpan>>
```

`WorkflowEngine.register` strips infrastructure tags from the user's effect:

```31:54:.reference/effect/packages/effect/src/unstable/workflow/WorkflowEngine.ts
    ) => Effect.Effect<
      void,
      never,
      | Scope.Scope
      | Exclude<
        R,
        | WorkflowEngine
        | WorkflowInstance
        | Workflow.Execution<Name>
        | Scope.Scope
      >
```

When you build a service whose method runs the caller's effect with extra
context, type the return as `Effect<A, E, Exclude<R, TagsYouProvide>>`. This is
how you keep your service from acting like a virus that infects the caller's `R`.

### 5.3 Don't expose `Scope` unless the API is genuinely scoped

`Layer.effect` already strips `Scope` from `RIn` (see §2). For *methods* on a
service, only put `Scope` in `R` when the method really does need the caller to
manage a lifetime — e.g. `SqlClient.reserve`:

```40:47:.reference/effect/packages/effect/src/unstable/sql/SqlClient.ts
  readonly reserve: Effect.Effect<Connection.Connection, SqlError, Scope.Scope>

  /**
   * With the given effect, ensure all sql queries are run in a transaction.
   */
  readonly withTransaction: <R, E, A>(
    self: Effect.Effect<A, E, R>
  ) => Effect.Effect<A, E | SqlError, R>
```

`reserve` is honest about needing a `Scope`. `withTransaction` does *not* add a
new tag — it preserves the caller's `R` untouched.

### 5.4 Construction-time vs call-time, intentionally split

`Cache.makeWith` shows Effect itself splitting these explicitly via a
`requireServicesAt: "lookup" | "construction"` flag:

```146:160:.reference/effect/packages/effect/src/Cache.ts
export const makeWith = <
  Key, A, E = never, R = never,
  ServiceMode extends "lookup" | "construction" = never
>(lookup: (key: Key) => Effect.Effect<A, E, R>, options: {
  readonly capacity: number
  readonly timeToLive?: ((exit: Exit.Exit<A, E>, key: Key) => Duration.Input) | undefined
  readonly requireServicesAt?: ServiceMode | undefined
}): Effect.Effect<
  Cache<Key, A, E, "lookup" extends ServiceMode ? R : never>,
  never,
  "lookup" extends ServiceMode ? never : R
>
```

The default in your services should be **construction-time**: capture once, never
ask the caller again.

### 5.5 Beware "with" helpers — they propagate `R`

`Console.consoleWith` / `Clock.clockWith` / `Random.randomWith` all preserve the
callback's `R`:

```131:160:.reference/effect/packages/effect/src/Console.ts
export const consoleWith = <A, E, R>(f: (console: Console) => Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
  core.withFiber((fiber) => f(fiber.getRef(Console)))
```

That's *correct* for primitives, but if you build a similar helper inside your own
service make sure the callback in question doesn't drag in tags you've already
provided.

---

## 6. Composing layers like lego blocks

You have eight composition primitives, learned in this order:

| Combinator                 | Meaning                                                                  |
| -------------------------- | ------------------------------------------------------------------------ |
| `Layer.succeed(Tag, value)`  | Wrap a literal value as a service.                                       |
| `Layer.effect(Tag, eff)`     | Build a service from an `Effect` (most common).                          |
| `Layer.effectDiscard(eff)`   | Run a side-effect at startup; provides nothing. (replaces v3 `scopedDiscard`) |
| `Layer.merge(a, b)`          | Sibling layers; outputs and inputs *unioned*.                            |
| `Layer.mergeAll(a, b, c, …)` | n-ary `merge`.                                                           |
| `Layer.provide(self, that)`  | Wire `that`'s outputs into `self`'s inputs. Result exposes only `self`'s `ROut`. |
| `Layer.provideMerge(self, that)` | Same as `provide`, but keeps both layers' outputs visible.           |
| `Layer.unwrap(eff)`          | Flatten an `Effect<Layer>` into a `Layer`.                               |

The two that matter most for "shrinking `RIn` to `never`" are **`provide`** and
**`provideMerge`**, both of which apply `Exclude<RIn2, ROut>` against the inner
layer's requirements:

```1067:1081:.reference/effect/packages/effect/src/Layer.ts
export const provide: {
  <RIn, E, ROut>(
    that: Layer<ROut, E, RIn>
  ): <RIn2, E2, ROut2>(self: Layer<ROut2, E2, RIn2>) => Layer<ROut2, E | E2, RIn | Exclude<RIn2, ROut>>
```

```1165:1175:.reference/effect/packages/effect/src/Layer.ts
export const provideMerge: {
  <RIn, E, ROut>(
    that: Layer<ROut, E, RIn>
  ): <RIn2, E2, ROut2>(self: Layer<ROut2, E2, RIn2>) => Layer<ROut | ROut2, E | E2, RIn | Exclude<RIn2, ROut>>
```

Read the type: take what `self` still needs (`RIn2`), subtract what `that`
provides (`ROut`), union with what `that` itself needs (`RIn`). Each
`provide`/`provideMerge` call is a step toward `RIn = never`.

### `provide` vs `provideMerge` rule of thumb

- **`provide`**: "wire and hide." Use when the dependency is an implementation
  detail your callers shouldn't see. (E.g. wire `Database` into `UserService`,
  but `Database` is not part of your app's public surface.)
- **`provideMerge`**: "wire and re-export." Use when both layers are part of the
  same public bundle. This is exactly how `NodeServices.layer` and
  `BunServices.layer` are built — see §7.

---

## 7. The "platform context" pattern: bundling shared infrastructure

Effect itself uses a recurring pattern for "shared infra bundle" layers:
many tiny layers, merged, with one foundational layer `provideMerge`'d under
them so everything in the bundle gets it for free.

```20:34:.reference/effect/packages/platform-node/src/NodeServices.ts
export type NodeServices = ChildProcessSpawner | FileSystem | Path | Stdio | Terminal

export const layer: Layer.Layer<NodeServices> = Layer.provideMerge(
  NodeChildProcessSpawner.layer,
  Layer.mergeAll(
    NodeFileSystem.layer,
    NodePath.layer,
    NodeStdio.layer,
    NodeTerminal.layer
  )
)
```

```20:32:.reference/effect/packages/platform-bun/src/BunServices.ts
export const layer: Layer.Layer<BunServices> = BunChildProcessSpawner.layer.pipe(
  Layer.provideMerge(Layer.mergeAll(
    BunFileSystem.layer,
    BunPath.layer,
    BunStdio.layer,
    BunTerminal.layer
  ))
)
```

You should do the same in your app for any cluster of services that always ship
together.

```ts
// e.g. all your "data plane" services
export const DataLayer = Layer.mergeAll(
  UserService.Live,
  OrderService.Live,
  PaymentService.Live
).pipe(
  Layer.provide(Database.Live),
  Layer.provide(Logger.Live)
)
// DataLayer: Layer<UserService | OrderService | PaymentService, …, never>
```

---

## 8. Assembling the super-layer at the program edge

The end-of-program pattern in the Effect repo is consistently:

> "Define small layers. Merge them. Provide their inner deps. Hand the result to
> the runtime."

A real entrypoint from the reference:

```15:22:.reference/effect/packages/tools/bundle/src/bin.ts
const MainLayer = Layer.mergeAll(
  Fixtures.layer,
  Reporter.layer
).pipe(Layer.provideMerge(NodeServices.layer))

Command.run(cli, { version: PackageJson["version"] }).pipe(
  Effect.provide(MainLayer),
  NodeRuntime.runMain
)
```

A more elaborate one (cluster):

```44:64:.reference/effect/packages/platform-node/test/cluster/SocketRunner.test.ts
const SharedStorage = Layer.mergeAll(
  RunnerStorage.layerMemory,
  MessageStorage.layerMemory
).pipe(
  Layer.provide(ShardingConfig.layerDefaults)
)

const makeRunnerLayer = (port: number) =>
  TestEntityLayer.pipe(
    Layer.provideMerge(SocketRunner.layer),
    Layer.provide(RunnerHealth.layerNoop),
    Layer.provide(NodeClusterSocket.layerSocketServer),
    Layer.provide(NodeClusterSocket.layerClientProtocol),
    Layer.provide(ShardingConfig.layer({ /* … */ })),
    Layer.provide(RpcSerialization.layerMsgPack)
  )
```

Two reusable templates for your own apps:

### 8.1 One-shot CLI / script

```ts
const MainLive = Layer.mergeAll(
  ServiceA.Live,
  ServiceB.Live,
  ServiceC.Live
).pipe(
  Layer.provide(Layer.mergeAll(
    Database.Live,
    HttpClient.Live,
    Logger.Live
  )),
  Layer.provideMerge(NodeServices.layer)
)
// MainLive: Layer<ServiceA | ServiceB | ServiceC | NodeServices, …, never>

program.pipe(Effect.provide(MainLive), NodeRuntime.runMain)
```

### 8.2 Long-running server

```ts
const HttpServerLive = HttpRouter.serve(routes).pipe(
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 }))
)

NodeRuntime.runMain(Layer.launch(HttpServerLive))
```

`Layer.launch` builds the layer, then waits forever (`Effect<never, E, RIn>`) —
ideal for "the application *is* the layer":

```1819:1820:.reference/effect/packages/effect/src/Layer.ts
export const launch = <RIn, E, ROut>(self: Layer<ROut, E, RIn>): Effect<never, E, RIn> =>
  internalEffect.scoped(internalEffect.andThen(build(self), internalEffect.never))
```

### 8.3 Web framework / many handlers — `ManagedRuntime`

For frameworks where many independent `Effect`s want to run against the same
fully-assembled layer, build the layer **once** and reuse the runtime:

```130:165:.reference/effect/packages/effect/src/ManagedRuntime.ts
export const make = <R, ER>(
  layer: Layer.Layer<R, ER, never>,
  options?: {
    readonly memoMap?: Layer.MemoMap | undefined
  } | undefined
): ManagedRuntime<R, ER> => {
```

```60:68:.reference/effect/ai-docs/src/03_integration/10_managed-runtime.ts
export const appMemoMap = Layer.makeMemoMapUnsafe()

export const runtime = ManagedRuntime.make(TodoRepo.layer, {
  memoMap: appMemoMap
})
```

`ManagedRuntime.make` requires `Layer<R, ER, never>` — i.e. **fully wired**. You
can verify by trying to build it: if `RIn ≠ never`, you'll get a compile error.

---

## 9. Memoization: "build each layer once"

Layers are shared by default within a single composition graph:

```12:13:.reference/effect/packages/effect/src/Layer.ts
 * By default layers are shared, meaning that if the same layer is used twice
 * the layer will only be allocated a single time.
```

```137:141:.reference/effect/packages/effect/src/Layer.ts
 * A MemoMap is used to memoize layer construction and ensure sharing of layers.
```

So if `UserService.Live` and `OrderService.Live` both `Layer.provide(Database.Live)`,
the database is built once in the merged graph.

But: separate `Effect.provide(layer)` calls on separate `runPromise`s do *not*
share by default. For that, use `ManagedRuntime` (one runtime ⇒ one layer build),
or share an explicit `MemoMap`:

```5:38:.reference/effect/packages/effect/test/ManagedRuntime.test.ts
  test("memoizes the layer build", async () => {
    let count = 0
    const layer = Layer.effectDiscard(Effect.sync(() => {
      count++
    }))
    const runtime = ManagedRuntime.make(layer)
    await runtime.runPromise(Effect.void)
    await runtime.runPromise(Effect.void)
    await runtime.dispose()
    strictEqual(count, 1)
  })
```

Use `Layer.fresh` only when you *want* a fresh instance (rare — typically tests
or genuinely-isolated subsystems):

```1711:1763:.reference/effect/packages/effect/src/Layer.ts
 * Creates a fresh version of this layer that will not be shared.
 * ...
export const fresh = <A, E, R>(self: Layer<A, E, R>): Layer<A, E, R> =>
  fromBuildUnsafe((_, scope) => self.build(makeMemoMapUnsafe(), scope))
```

---

## 10. Anti-patterns to ban

These all cause `R` leakage and break the "lego block" property.

### ❌ Returning methods that re-yield captured deps

```ts
make: Effect.gen(function*() {
  const db = yield* Database
  return {
    find: (id: string) =>
      Effect.gen(function*() {
        const db2 = yield* Database  // ← redundant; bloats R unnecessarily
        return yield* db2.query(...)
      })
  }
})
```

Capture once. Use the captured reference inside method bodies.

### ❌ Re-exposing infra tags in your service interface

```ts
interface BadService {
  // forces every caller to provide Database & Logger
  readonly find: (id: string) => Effect.Effect<User, Err, Database | Logger>
}
```

If `BadService` is built by a layer that already has `Database | Logger` in its
`RIn`, the methods should have `R = never`. Whatever instance you got from
`yield* BadService` already had its deps satisfied at construction.

### ❌ Putting `Scope` in a method's `R` when not needed

`Layer.effect` strips `Scope` from `RIn`. If your method genuinely returns a
resource the caller must manage (like `SqlClient.reserve`), keep `Scope`.
Otherwise, don't.

### ❌ One giant service with 12 dependencies

Split it. If two methods don't share state or deps, they're two services.

### ❌ Building layers inside request handlers

`Effect.provide(L)` inside a hot path will rebuild `L` for every request unless
you're using a shared `MemoMap` or `ManagedRuntime`. Build once at startup;
inject the runtime/services down.

### ❌ Passing services as plain function parameters "to be explicit"

The `R` channel exists for this. Threading `Database` as an argument bypasses
the dependency graph, ruins memoization, and removes the type-level guarantee
that the dep is provided.

---

## 11. Quick reference checklist

Before merging a new service, verify:

- [ ] The service has a single, named capability.
- [ ] The interface has methods returning `Effect<A, E>` with the **narrowest possible `R`** (often `never`).
- [ ] `make` is an `Effect.gen` (or `Effect.fn(Untraced)`) generator that yields its dependencies once and closes over them.
- [ ] The layer is `Layer.effect(this, this.make)` exposed as `static Live` (or `static Default`).
- [ ] **0–5** `yield*` lines for dependencies in `make`. More than 5 → split, or introduce a sub-bundle layer.
- [ ] No `Scope` in any method's `R` unless that method genuinely produces a scoped resource.
- [ ] No service's own tag appears in its methods' `R`.
- [ ] Methods that run user-provided effects use `Exclude<R, …>` on their return type to strip tags they provide.

For the program as a whole:

- [ ] There is exactly **one** assembled root layer (`MainLive`).
- [ ] Its type is `Layer<App, AppError, never>` — verify by feeding it to `ManagedRuntime.make`, which only accepts `RIn = never`.
- [ ] Construction wires inner deps via `Layer.provide` / `Layer.provideMerge`, never via per-method threading.
- [ ] The runtime is built **once**: `Layer.launch(MainLive)`, `Effect.runPromise(program.pipe(Effect.provide(MainLive)))`, or `ManagedRuntime.make(MainLive)`.

If every box is checked, services slot together like lego — and your program's
type signature becomes the single source of truth for which capabilities exist
and which dependencies still need to be supplied.

---

## Appendix: API map (Effect 4)

| Capability                     | Effect 4 export                       |
| ------------------------------ | ------------------------------------- |
| Define service tag/class       | `Context.Service<Self, Shape>()(id, { make })` |
| Always-available service       | `Context.Reference<T>` + `defaultValue` in `make` options |
| Wrap a value as layer          | `Layer.succeed(Tag, value)`           |
| Build a service from an effect | `Layer.effect(Tag, eff)`              |
| Side-effect-only init layer    | `Layer.effectDiscard(eff)` *(replaces `Layer.scopedDiscard`)* |
| Combine peer layers            | `Layer.merge`, `Layer.mergeAll`       |
| Wire deps in (hide them)       | `Layer.provide`                       |
| Wire deps in (re-export)       | `Layer.provideMerge`                  |
| Flatten `Effect<Layer>`        | `Layer.unwrap` *(not `unwrapEffect`)* |
| Bypass memoization             | `Layer.fresh`                         |
| Run program with layer         | `Effect.provide(L)` then `Effect.runPromise` |
| Run layer as long-lived app    | `Layer.launch(L)`                     |
| Many runs, shared layer build  | `ManagedRuntime.make(L)`              |
| Compile-time `RIn` check       | `Layer.satisfiesServicesType<never>()` |
| Strip a tag from `R`           | `Exclude<R, Tag>` in your return type |
| Strip `ParentSpan`             | `Effect.withSpan(name)`               |

> Names that *don't* exist in Effect 4 (despite older docs): `Context.Tag`,
> `Context.GenericTag`, `Effect.Service` (the *class* lives on `Context`),
> `Layer.scoped`, `Layer.scopedDiscard`, `Layer.unwrapEffect`, `Layer.discard`,
> `Layer.toRuntime`. Use the modern names in the table above.
