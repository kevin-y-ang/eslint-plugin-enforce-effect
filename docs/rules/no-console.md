# `no-console`

Disallow `console.*` calls in favor of Effect's structured `Logger`.

## Why?

`console.log` / `console.error` / `console.warn` write to the host's stdout
or stderr without any context: no log level, no fiber id, no span, no
correlation with the surrounding effect. That makes structured search,
filtering by level, sampling, and test capture all hard.

Effect's `Logger` adds level (`Trace` / `Debug` / `Info` / `Warning` /
`Error` / `Fatal`), spans (`Effect.withLogSpan`), arbitrary annotations
(`Effect.annotateLogs`), `Cause` formatting for failures, and is replaceable
in tests (`Logger.replace`) — so production code can ship JSON to a log
collector while tests assert on captured log output.

## Primitives

### `Effect.log`

`Effect<void>` that logs a message at the default `Info` level via the
ambient `Logger` services. Drop-in replacement for `console.log` inside an
`Effect.gen`.

Vanilla:

```ts
console.log("user signed in", { id });
```

Effect:

```ts
import { Effect } from "effect";

const program = Effect.gen(function* () {
  yield* Effect.log("user signed in", { id });
});
```

### `Effect.logTrace` / `Effect.logDebug` / `Effect.logInfo` / `Effect.logWarning` / `Effect.logError` / `Effect.logFatal`

Level-specific log helpers. Use the level that matches the event so log
filtering, alerting, and sampling rules can act on it. `Effect.logError`
also accepts a `Cause` to include structured failure info.

Vanilla:

```ts
console.warn("rate limit reached");
console.error("request failed", err);
```

Effect:

```ts
import { Cause, Effect } from "effect";

const program = Effect.gen(function* () {
  yield* Effect.logWarning("rate limit reached");
  yield* Effect.logError("request failed", Cause.fail(err));
});
```

### `Effect.withLogSpan`

Wraps an effect so every log message produced inside it carries a named
span with elapsed time. Use instead of bracketing `console.log` with manual
"start" / "end" prints.

Vanilla:

```ts
console.log("[handleRequest] start");
const result = await handleRequest();
console.log("[handleRequest] done");
```

Effect:

```ts
import { Effect } from "effect";

const program = Effect.withLogSpan("handleRequest")(handleRequest);
```

### `Effect.annotateLogs`

Adds key/value annotations to every log produced inside the wrapped effect
(for example a `requestId`). Replaces ad hoc string interpolation in
`console.log` calls so that downstream parsers see structured fields.

Vanilla:

```ts
console.log(`[${requestId}] started`);
```

Effect:

```ts
import { Effect } from "effect";

const program = Effect.annotateLogs("requestId", requestId)(
  Effect.gen(function* () {
    yield* Effect.log("started");
  }),
);
```

### `Effect.withMinimumLogLevel`

Locally raises or lowers the minimum log level for a sub-program. Use to
quiet a noisy section, or to crank up verbosity on a specific code path
without rewiring the whole logger.

Vanilla:

```ts
// no equivalent: console doesn't have levels
```

Effect:

```ts
import { Effect, LogLevel } from "effect";

const program = Effect.withMinimumLogLevel(LogLevel.Debug)(
  Effect.gen(function* () {
    yield* Effect.logDebug("verbose detail");
  }),
);
```

### `Logger.make`

Constructs a custom `Logger` from a function that receives a structured log
record (level, message, cause, spans, annotations, fiber id). Use to ship
JSON to a log collector or to capture logs in tests.

Vanilla:

```ts
console.log = (...args) => writeJsonToCollector(args);
```

Effect:

```ts
import { Effect, Logger } from "effect";

const jsonLogger = Logger.make(({ message, logLevel, spans, annotations }) => {
  writeJsonToCollector({ message, logLevel, spans, annotations });
});

const program = Effect.gen(function* () {
  yield* Effect.log("hello");
}).pipe(Effect.provide(Logger.replace(Logger.defaultLogger, jsonLogger)));
```

### `Logger.replace`

Swaps the runtime's `Logger` for another (for example a JSON logger in
production, an in-memory collector in tests). Use this instead of monkey
patching `console`.

Vanilla:

```ts
const original = console.log;
console.log = (...args) => collected.push(args);
// run test
console.log = original;
```

Effect:

```ts
import { Effect, Logger } from "effect";

const collected: ReadonlyArray<string> = [];
const captureLogger = Logger.make(({ message }) => {
  (collected as Array<string>).push(String(message));
});

const program = Effect.gen(function* () {
  yield* Effect.log("hello");
}).pipe(Effect.provide(Logger.replace(Logger.defaultLogger, captureLogger)));
```
