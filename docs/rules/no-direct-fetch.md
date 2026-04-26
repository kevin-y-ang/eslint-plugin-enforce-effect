# `no-direct-fetch`

Disallow direct `fetch()` usage in favor of a typed API client.

## Why?

A typed `HttpClient` models requests and responses in the `Effect` error channel, supports testable layers, and works with `Schema` and `HttpApi` so URLs, methods, and bodies stay consistent. Raw `fetch` is untyped, easy to call without handling failures uniformly, and bypasses the shared HTTP stack your app standardizes on.

## Primitives

### `HttpClient`

The `HttpClient` service is the pluggable entry point for HTTP in Effect: inject it and call `get`, `post`, or `execute` on built `HttpClientRequest` values, with all transport errors as `HttpClientError`.

Vanilla:

```ts
const res = await fetch("https://api.example.com/v1/config");
if (!res.ok) throw new Error(String(res.status));
const json = await res.json();
```

Effect:

```ts
import * as Effect from "effect/Effect";
import { FetchHttpClient, HttpClient } from "effect/unstable/http";

const program = Effect.gen(function* () {
  const res = yield* HttpClient.get("https://api.example.com/v1/config");
  return yield* res.json;
}).pipe(Effect.provide(FetchHttpClient.layer));
```

### `FetchHttpClient`

`FetchHttpClient.layer` is the standard `Layer` that implements `HttpClient` using `globalThis.fetch` (overridable via the `Fetch` service ref) with Effect-friendly error handling.

Vanilla:

```ts
await fetch("https://api.example.com/ping", { method: "GET" });
```

Effect:

```ts
import * as Effect from "effect/Effect";
import { FetchHttpClient, HttpClient } from "effect/unstable/http";

const ping = HttpClient.get("https://api.example.com/ping").pipe(
  Effect.provide(FetchHttpClient.layer),
);
```

### `HttpClientRequest`

`HttpClientRequest` is the immutable description of a single HTTP call (method, URL, headers, body); use it when you need fine-grained control and pass the result to `HttpClient#execute` instead of ad hoc `fetch` options objects.

Vanilla:

```ts
const res = await fetch("https://api.example.com/items", {
  method: "GET",
  headers: { accept: "application/json" },
});
```

Effect:

```ts
import * as Effect from "effect/Effect";
import { FetchHttpClient, HttpClient, HttpClientRequest } from "effect/unstable/http";

const program = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient;
  const req = HttpClientRequest.get("https://api.example.com/items").pipe(
    HttpClientRequest.setHeader("accept", "application/json"),
  );
  return yield* client.execute(req);
}).pipe(Effect.provide(FetchHttpClient.layer));
```

### `HttpClientResponse`

`HttpClientResponse` is the response model attached to the outgoing `HttpClientRequest` with Effect-backed `json` / `text` and helpers like `schemaBodyJson` for validated decoding, replacing one-off `Response` usage.

Vanilla:

```ts
const res = await fetch("https://api.example.com/user/1");
const body: unknown = await res.json();
```

Effect:

```ts
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { FetchHttpClient, HttpClient, HttpClientResponse } from "effect/unstable/http";

const User = Schema.Struct({ id: Schema.Number, name: Schema.String });

const program = HttpClient.get("https://api.example.com/user/1").pipe(
  Effect.flatMap(HttpClientResponse.schemaBodyJson(User)),
  Effect.provide(FetchHttpClient.layer),
);
```

### `HttpApiClient`

`HttpApiClient` builds a type-safe client from an `HttpApi` definition (groups, endpoints, and `Schema` payloads) so call sites mirror the API shape instead of string-building URLs and manual JSON.

Vanilla:

```ts
const id = 1;
const res = await fetch(`https://api.example.com/users/${id}`);
const data = (await res.json()) as { name: string };
```

Effect:

```ts
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { FetchHttpClient } from "effect/unstable/http";
import { HttpApi, HttpApiClient, HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

const Api = HttpApi.make("api").add(
  HttpApiGroup.make("users").add(
    HttpApiEndpoint.get("byId", "/users/:id", { success: Schema.Struct({ name: Schema.String }) }),
  ),
);

const program = Effect.gen(function* () {
  const client = yield* HttpApiClient.make(Api, { baseUrl: "https://api.example.com" });
  return yield* client.users.byId({ params: { id: 1 } });
}).pipe(Effect.provide(FetchHttpClient.layer));
```

### `NodeHttpClient.layerUndici`

`NodeHttpClient.layerUndici` provides `HttpClient` on Node using Undici’s dispatcher, which is a good default when you want HTTP/1.1 performance and control without going through the browser-style `fetch` path.

Vanilla:

```ts
// Typical Node: global fetch is backed by undici, but call sites are still untyped "fetch" usage.
const res = await fetch("https://www.example.com/");
console.log(await res.text());
```

Effect:

```ts
import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient";
import * as Effect from "effect/Effect";
import { HttpClient } from "effect/unstable/http";

const program = Effect.gen(function* () {
  return yield* HttpClient.get("https://www.example.com/").pipe(Effect.flatMap((r) => r.text));
}).pipe(Effect.provide(NodeHttpClient.layerUndici));
```

### `NodeHttpClient.layerNodeHttp`

`NodeHttpClient.layerNodeHttp` implements `HttpClient` with Node’s `http` / `https` stack (and a managed agent layer), for environments or policies where the built-in client is preferred over Undici or `fetch`.

Vanilla:

```ts
import { get } from "node:https";
await new Promise<void>((resolve, reject) => {
  get("https://www.example.com/", (res) => {
    res.resume();
    res.on("end", resolve);
  }).on("error", reject);
});
```

Effect:

```ts
import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient";
import * as Effect from "effect/Effect";
import { HttpClient } from "effect/unstable/http";

const program = HttpClient.get("https://www.example.com/").pipe(
  Effect.flatMap((r) => r.text),
  Effect.provide(NodeHttpClient.layerNodeHttp),
);
```

### `BrowserHttpClient.layerXMLHttpRequest`

`BrowserHttpClient.layerXMLHttpRequest` supplies `HttpClient` using `XMLHttpRequest` (with an optional `XMLHttpRequest` constructor service for tests), for legacy constraints or when you need XHR-specific behavior instead of the default fetch-based layer.

Vanilla:

```ts
const res = await fetch("https://api.example.com/status");
console.log(res.status, await res.text());
```

Effect:

```ts
import * as BrowserHttpClient from "@effect/platform-browser/BrowserHttpClient";
import * as Effect from "effect/Effect";
import { HttpClient } from "effect/unstable/http";

const program = HttpClient.get("https://api.example.com/status").pipe(
  Effect.flatMap((r) => r.text),
  Effect.provide(BrowserHttpClient.layerXMLHttpRequest),
);
```
