# `no-fs`

Disallow imports from `fs`, `node:fs`, `fs/promises`, and `node:fs/promises`.

## Why?

Effect-oriented codebases prefer the cross-platform `FileSystem` service over
direct `node:fs` access. Going through the service makes file I/O testable
(swap the layer in tests), portable across Node and Bun (via
`NodeFileSystem.layer` / `BunFileSystem.layer`), interruption-aware, and
composable with the rest of the `Effect` ecosystem (`Stream`, `Sink`,
`Scope`).

## Primitives

### `FileSystem.FileSystem`

The `FileSystem` service tag. Yield it inside an `Effect.gen` to get a service
value with `readFile`, `readFileString`, `writeFile`, `writeFileString`,
`exists`, `stat`, `readDirectory`, `makeDirectory`, `remove`, `copy`, `rename`,
`open`, `makeTempDirectory`, `makeTempFile`, `truncate`, `chmod`, `chown`,
`link`, `symlink`, `readLink`, `realPath`, `access`, `utimes`, and `watch`.

Vanilla:

```ts
import { readFile } from "node:fs/promises";

const text = await readFile("./hello.txt", "utf8");
```

Effect:

```ts
import { FileSystem } from "effect";
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const text = yield* fs.readFileString("./hello.txt");
  return text;
});
```

### `FileSystem.stream` / `FileSystem.sink`

Read or write a file as a `Stream<Uint8Array>` / `Sink<Uint8Array>`. Use
these instead of `fs.createReadStream` / `fs.createWriteStream` to get
interruption, backpressure, and seamless composition with other `Stream`
operators.

Vanilla:

```ts
import { createReadStream } from "node:fs";

const stream = createReadStream("./big.bin", { highWaterMark: 64 * 1024 });
stream.on("data", (chunk) => process.stdout.write(chunk as Buffer));
```

Effect:

```ts
import { FileSystem } from "effect";
import { Effect, Stream } from "effect";

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  yield* fs
    .stream("./big.bin", { chunkSize: 64 * 1024 })
    .pipe(Stream.runForEach((chunk) => Effect.sync(() => process.stdout.write(chunk))));
});
```

### `FileSystem.open` + `File`

Open a file as a scoped `File` handle with `read`, `write`, `seek`, `stat`,
`truncate`, etc. Use this instead of `fs.open` / `fs.promises.open` to get
automatic cleanup via `Scope`.

Vanilla:

```ts
import { open } from "node:fs/promises";

const handle = await open("./log.txt", "a");
try {
  await handle.write("entry\n");
} finally {
  await handle.close();
}
```

Effect:

```ts
import { FileSystem } from "effect";
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const file = yield* fs.open("./log.txt", { flag: "a" });
  yield* file.writeAll(new TextEncoder().encode("entry\n"));
}).pipe(Effect.scoped);
```

### `NodeFileSystem.layer`

Layer that provides the `FileSystem` service backed by `node:fs`. Provide
this at the edge of your program (typically in `main`) so the rest of the
code can depend on `FileSystem.FileSystem` without referencing `node:fs`.

Vanilla:

```ts
import { writeFile } from "node:fs/promises";

await writeFile("./out.txt", "hello");
```

Effect:

```ts
import { NodeFileSystem } from "@effect/platform-node";
import { FileSystem } from "effect";
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  yield* fs.writeFileString("./out.txt", "hello");
}).pipe(Effect.provide(NodeFileSystem.layer));
```

### `NodeServices.layer`

Bundled Node platform layer that merges `NodeFileSystem.layer`,
`NodePath.layer`, `NodeStdio.layer`, `NodeTerminal.layer`, and
`NodeChildProcessSpawner.layer`. Use this in CLI-style programs that need
several Node services at once.

Vanilla:

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

await mkdir("./out", { recursive: true });
await writeFile(join("./out", "hello.txt"), "hi");
```

Effect:

```ts
import { NodeServices } from "@effect/platform-node";
import { FileSystem, Path } from "effect";
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  yield* fs.makeDirectory("./out", { recursive: true });
  yield* fs.writeFileString(path.join("./out", "hello.txt"), "hi");
}).pipe(Effect.provide(NodeServices.layer));
```

### `BunFileSystem.layer`

Bun-runtime layer that provides the same `FileSystem` service. Use this in
Bun programs so the rest of your code stays runtime-agnostic.

Vanilla:

```ts
import { readFile } from "node:fs/promises";

const text = await readFile("./hello.txt", "utf8");
```

Effect:

```ts
import { BunFileSystem } from "@effect/platform-bun";
import { FileSystem } from "effect";
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  return yield* fs.readFileString("./hello.txt");
}).pipe(Effect.provide(BunFileSystem.layer));
```

### `Path.Path`

The `Path` service tag. Use `path.join`, `path.resolve`, `path.dirname`,
`path.basename`, etc., instead of importing `node:path`. Pair with
`NodePath.layer` (or `NodeServices.layer`) to provide the implementation.

Vanilla:

```ts
import { join } from "node:path";

const target = join("/tmp", "out", "hello.txt");
```

Effect:

```ts
import { Path } from "effect";
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const path = yield* Path.Path;
  return path.join("/tmp", "out", "hello.txt");
});
```
