# `no-process-env`

Disallow direct `process.env` access in favor of explicit configuration.

## Why?

Effect-oriented codebases usually prefer configuration to be loaded, validated,
and injected explicitly. Reading from `process.env` inline makes configuration
ambient and harder to test.

## Primitives

### `Config.string`

Declares a config key whose value is read as a string, which is the usual first step for hostnames, slugs, and other unstructured text that still needs validation and injection through `ConfigProvider`.

Vanilla:

```ts
const serviceName: string = process.env.SERVICE_NAME ?? "";
```

Effect:

```ts
import { Config, ConfigProvider, Effect } from "effect";

const program = Config.string("SERVICE_NAME");
const out = Effect.runSync(program.parse(ConfigProvider.fromEnv({ env: { SERVICE_NAME: "api" } })));
```

### `Config.integer`

In Effect 4.x this role is served by `Config.int` (there is no `Config.integer` export): it decodes a string to an integer and rejects floats, for settings that must be whole numbers such as replica counts and IDs.

Vanilla:

```ts
const maxConnections = Number.parseInt(process.env.MAX_CONNECTIONS ?? "0", 10);
```

Effect:

```ts
import { Config, ConfigProvider, Effect } from "effect";

const program = Config.int("MAX_CONNECTIONS");
const out = Effect.runSync(
  program.parse(ConfigProvider.fromEnv({ env: { MAX_CONNECTIONS: "10" } })),
);
```

### `Config.boolean`

Parses common string encodings of booleans (for example `yes` / `no`, `1` / `0`) into a real `boolean`, which fits feature flags and toggles stored as env values.

Vanilla:

```ts
const debug: boolean = process.env.DEBUG === "1" || process.env.DEBUG === "true";
```

Effect:

```ts
import { Config, ConfigProvider, Effect } from "effect";

const program = Config.boolean("DEBUG");
const out = Effect.runSync(program.parse(ConfigProvider.fromEnv({ env: { DEBUG: "1" } })));
```

### `Config.schema`

Builds a `Config` from any `Schema.Codec` so you can model structs, unions, and custom validation in one place instead of hand-parsing `process.env` fields one by one.

Vanilla:

```ts
const appHost = process.env.APP_HOST;
const appPort = process.env.APP_PORT;
void appHost;
void appPort;
```

Effect:

```ts
import { Config, ConfigProvider, Effect, Schema } from "effect";

const App = Config.schema(Schema.Struct({ host: Schema.String, port: Schema.Int }), "app");
const out = Effect.runSync(
  App.parse(ConfigProvider.fromUnknown({ app: { host: "localhost", port: 3000 } })),
);
```

### `Config.nested`

Scopes a config (or a bundle from `Config.all`) under a path prefix so the same field names can be reused under `database_`, `redis_`, or nested objects without colliding with other groups.

Vanilla:

```ts
const host = process.env.DATABASE_HOST;
void host;
```

Effect:

```ts
import { Config, ConfigProvider, Effect } from "effect";

const db = Config.string("host").pipe(Config.nested("database"));
const out = Effect.runSync(
  db.parse(ConfigProvider.fromEnv({ env: { database_host: "localhost" } })),
);
```

### `Config.withDefault`

Supplies a fallback when the error is _only_ from missing data (not from invalid values), so optional settings can have a default without reimplementing that logic around `process.env`.

Vanilla:

```ts
const port = process.env.PORT != null ? Number.parseInt(process.env.PORT, 10) : 3000;
void port;
```

Effect:

```ts
import { Config, ConfigProvider, Effect } from "effect";

const program = Config.number("PORT").pipe(Config.withDefault(3000));
const out = Effect.runSync(program.parse(ConfigProvider.fromUnknown({})));
```

### `Config.redacted`

Parses a string and wraps it in `Redacted` so API keys and other secrets are less likely to leak through logs and stringification compared to a plain `process.env` string.

Vanilla:

Vanilla
const apiKey: string = process.env.OPENAI_API_KEY ?? "";
void apiKey;

````

Effect:

```ts
import { Config, ConfigProvider, Effect } from "effect";

const program = Config.redacted("OPENAI_API_KEY");
const out = Effect.runSync(
  program.parse(
    ConfigProvider.fromEnv({ env: { OPENAI_API_KEY: "sk-test-secret" } }),
  ),
);
void out;
````

### `Config.url`

Decodes a string with the `URL` constructor so base URLs and endpoints are validated up front instead of passing unchecked strings from `process.env` through the app.

Vanilla:

Vanilla
const base = new URL(process.env.PUBLIC_BASE_URL ?? "https://example.com");
void base;

````

Effect:

```ts
import { Config, ConfigProvider, Effect } from "effect";

const program = Config.url("PUBLIC_BASE_URL");
const out = Effect.runSync(
  program.parse(
    ConfigProvider.fromEnv({
      env: { PUBLIC_BASE_URL: "https://example.com" },
    }),
  ),
);
````

### `Config.port`

Reads and validates a port number in the 1–65535 range, avoiding subtle bugs from unvalidated integers pulled straight from the environment.

Vanilla:

Vanilla
const p = process.env.PORT != null
? Number.parseInt(process.env.PORT, 10)
: 8080;
void p;

````

Effect:

```ts
import { Config, ConfigProvider, Effect } from "effect";

const program = Config.port("PORT");
const out = Effect.runSync(
  program.parse(ConfigProvider.fromEnv({ env: { PORT: "8080" } })),
);
````

### `Config.duration`

Parses human-readable duration strings (for example with `Duration.fromInput`) for timeouts and intervals instead of ad hoc `process.env` + `setTimeout` math.

Vanilla:

Vanilla
const cacheTtl = process.env.CACHE_TTL_MS ?? "60000";
void cacheTtl;

````

Effect:

```ts
import { Config, ConfigProvider, Effect } from "effect";

const program = Config.duration("CACHE_TTL");
const out = Effect.runSync(
  program.parse(
    ConfigProvider.fromEnv({ env: { CACHE_TTL: "10 seconds" } }),
  ),
);
void out;
````

### `Config.literal`

Restricts a key to a single expected string literal, which is ideal for a fixed set of environment names (for example `development` / `production`) without manual equality checks on `process.env`.

Vanilla:

Vanilla
if (process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "production") {
throw new Error("invalid NODE_ENV");
}

````

Effect:

```ts
import { Config, ConfigProvider, Effect } from "effect";

const program = Config.literal("test", "NODE_ENV");
const out = Effect.runSync(
  program.parse(ConfigProvider.fromEnv({ env: { NODE_ENV: "test" } })),
);
````

### `ConfigProvider.fromEnv`

Supplies a `ConfigProvider` backed by a record of environment variables (defaulting to `process.env` when you omit `env`), so your app reads through `Config` instead of touching the global env object directly.

Vanilla:

Vanilla
const region = process.env.AWS_REGION;
void region;

````

Effect:

```ts
import { Config, ConfigProvider, Effect } from "effect";

const program = Config.string("region");
const out = Effect.runSync(
  program.parse(
    ConfigProvider.fromEnv({
      env: { region: "us-east-1" },
    }),
  ),
);
````

### `ConfigProvider.layer`

Turns a `ConfigProvider` (or an effect that produces one) into a `Layer` so tests and `Effect.provide` can install a known provider the same way as other services.

Vanilla:

Vanilla
process.env.FEATURE_X = "yes";
const flag = process.env.FEATURE_X;
void flag;

````

Effect:

```ts
import { Config, ConfigProvider, Effect } from "effect";

const testProvider = ConfigProvider.fromUnknown({ FEATURE_X: "yes" });
const program = Effect.gen(function* () {
  return yield* Config.boolean("FEATURE_X");
});
const enabled = Effect.runSync(
  Effect.provide(program, ConfigProvider.layer(testProvider)),
);
void enabled;
````

### `ConfigProvider.fromDotEnv`

Reads a `.env` file via `FileSystem`, parses it, and returns a `ConfigProvider` so local secrets and overrides live in a file while application code still uses `Config` (requires `FileSystem` in the context when you use this constructor).

Vanilla:

```ts
// e.g. dotenv/config populates process.env, then you read process.env
const api = process.env.API_URL;
void api;
```

Effect:

```ts
import { Config, ConfigProvider, Effect, FileSystem } from "effect";

const app = Effect.gen(function* () {
  const provider = yield* ConfigProvider.fromDotEnv({ path: ".env" });
  return yield* Config.string("API_URL").parse(provider);
});

void Effect.runPromise(
  app.pipe(
    Effect.provide(
      FileSystem.layerNoop({
        readFileString: () => Effect.succeed("API_URL=https://api.example.com\n"),
      }),
    ),
  ),
);
```

### `ConfigProvider.fromUnknown`

Wraps a plain JavaScript value (object, string map, and so on) as a `ConfigProvider`, which is the usual tool for fast, deterministic config in unit tests without touching the real environment.

Vanilla:

```ts
process.env.app_API_KEY = "test";
const apiKey = process.env.app_API_KEY;
void apiKey;
```

Effect:

```ts
import { Config, ConfigProvider, Effect, Schema } from "effect";

const testProvider = ConfigProvider.fromUnknown({
  app: { API_KEY: "test-key" },
});
const App = Config.schema(Schema.Struct({ API_KEY: Schema.String }), "app");
const out = Effect.runSync(App.parse(testProvider));
void out;
```
