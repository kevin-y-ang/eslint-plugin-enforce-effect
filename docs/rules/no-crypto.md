# `no-crypto`

Disallow `crypto` / `node:crypto` imports and ad hoc `globalThis.crypto`
access in favor of platform `Crypto` capability modules.

## Why?

The ambient `crypto` global (and the matching `node:crypto` module) ties
randomness and hashing to the host runtime. That makes them:

- **Untestable** — you can't deterministically replay a "random" failure or
  mock `crypto.subtle.digest`.
- **Non-portable** — code that imports from `node:crypto` won't run in the
  browser, and code that calls `globalThis.crypto.subtle` won't run in older
  Node releases.
- **Implicit** — there's nothing in a function signature that says "this
  function needs random bytes / a hashing primitive", so misuse is easy.

Effect's platform `Crypto` capability modules expose the same operations
(random bytes, UUIDs, hashing, subtle crypto) as a service that you provide
through a `Layer`. That makes them swappable in tests, portable across Node
and the browser, and explicit in the type system. For non-cryptographic
randomness, prefer the `Random` service (see also `no-math-random`).

## Primitives

### `Crypto.Crypto`

The `Crypto` service tag. Yield it inside an `Effect.gen` to access the
primitives the layer provides (random bytes, hashing, subtle crypto).

Vanilla:

```ts
import { randomBytes } from "node:crypto";

const bytes = randomBytes(16);
```

Effect:

```ts
import { Effect } from "effect";
import { Crypto } from "@effect/platform";

const program = Effect.gen(function* () {
  const crypto = yield* Crypto.Crypto;
  const bytes = yield* crypto.randomBytes(16);
  return bytes;
});
```

### `Crypto.randomBytes`

`Effect<Uint8Array>` that requests `n` cryptographically strong random
bytes via the `Crypto` service. Drop-in replacement for
`crypto.randomBytes(n)`.

Vanilla:

```ts
import { randomBytes } from "node:crypto";

const buf = randomBytes(32);
```

Effect:

```ts
import { Effect } from "effect";
import { Crypto } from "@effect/platform";

const program = Effect.gen(function* () {
  const buf = yield* Crypto.randomBytes(32);
  return buf;
});
```

### `Crypto.randomUUID`

`Effect<string>` that produces a v4 UUID via the `Crypto` service. Use
instead of `crypto.randomUUID()` so the call routes through a swappable
layer.

Vanilla:

```ts
const id = crypto.randomUUID();
```

Effect:

```ts
import { Effect } from "effect";
import { Crypto } from "@effect/platform";

const program = Effect.gen(function* () {
  const id = yield* Crypto.randomUUID;
  return id;
});
```

### `Crypto.getRandomValues`

Fills a typed array with cryptographically strong random values via the
`Crypto` service — replaces `crypto.getRandomValues(buf)` in browser code
paths.

Vanilla:

```ts
const buf = new Uint8Array(16);
globalThis.crypto.getRandomValues(buf);
```

Effect:

```ts
import { Effect } from "effect";
import { Crypto } from "@effect/platform";

const program = Effect.gen(function* () {
  const buf = new Uint8Array(16);
  yield* Crypto.getRandomValues(buf);
  return buf;
});
```

### `Crypto.hash` / `Crypto.subtle`

Hashing primitives (for example SHA-256) and subtle crypto operations
(sign, verify, derive, encrypt, decrypt) routed through the `Crypto`
service so the implementation can be replaced per platform / per test.

Vanilla:

```ts
import { createHash } from "node:crypto";

const digest = createHash("sha256").update(data).digest();
```

Effect:

```ts
import { Effect } from "effect";
import { Crypto } from "@effect/platform";

const program = Effect.gen(function* () {
  const digest = yield* Crypto.hash("SHA-256", data);
  return digest;
});
```

### `NodeCrypto.layer`

The Node implementation of `Crypto.Crypto`, backed by `node:crypto`. Provide
this layer in Node entry points and your code can stop importing
`node:crypto` directly.

Vanilla:

```ts
import { randomBytes } from "node:crypto";

const buf = randomBytes(16);
```

Effect:

```ts
import { Effect } from "effect";
import { Crypto } from "@effect/platform";
import { NodeCrypto } from "@effect/platform-node";

const program = Effect.gen(function* () {
  const buf = yield* Crypto.randomBytes(16);
  return buf;
}).pipe(Effect.provide(NodeCrypto.layer));
```

### `BrowserCrypto.layer`

The browser implementation of `Crypto.Crypto`, backed by
`globalThis.crypto`. Provide this layer in browser entry points instead of
calling `globalThis.crypto.*` from feature code.

Vanilla:

```ts
const buf = new Uint8Array(16);
globalThis.crypto.getRandomValues(buf);
```

Effect:

```ts
import { Effect } from "effect";
import { Crypto } from "@effect/platform";
import { BrowserCrypto } from "@effect/platform-browser";

const program = Effect.gen(function* () {
  const buf = new Uint8Array(16);
  yield* Crypto.getRandomValues(buf);
  return buf;
}).pipe(Effect.provide(BrowserCrypto.layer));
```

### `Random.next` / `Random.nextBytes` (non-cryptographic randomness)

For *non-cryptographic* randomness (jitter, sampling, shuffles, simulations),
prefer the `Random` service over `Crypto`. `Random` is seedable and
deterministic in tests; `Crypto` is the right choice only when you actually
need cryptographic strength. See [`no-math-random`](./no-math-random.md).
