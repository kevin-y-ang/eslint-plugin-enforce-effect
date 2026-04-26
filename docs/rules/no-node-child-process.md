# `no-node-child-process`

Disallow imports from `child_process` and `node:child_process`.

## Why?

Effect-oriented codebases often want process execution to be isolated behind
explicit runtime services instead of pulled in directly from Node core APIs.

## Primitives

### `ChildProcess.make`

`ChildProcess.make` describes a single shell-style command (template literal, string + args, or options + template) as an executable `Command` you later yield to spawn, instead of stringing `spawn` arguments together at the call site.

Vanilla:

```ts
import { spawn } from "node:child_process";

const child = spawn("node", ["--version"], {
  stdio: ["ignore", "pipe", "inherit"],
});
// … read child.stdout, wait for "exit" …
```

Effect:

```ts
import { NodeServices } from "@effect/platform-node";
import { Effect, Stream } from "effect";
import { ChildProcess } from "effect/unstable/process";

const program = Effect.gen(function* () {
  const handle = yield* ChildProcess.make("node", ["--version"]);
  const chunks = yield* Stream.runCollect(handle.stdout);
  const exitCode = yield* handle.exitCode;
  return { chunks, exitCode };
}).pipe(Effect.scoped, Effect.provide(NodeServices.layer));
```

### `ChildProcess.pipeTo`

`ChildProcess.pipeTo` models a shell-style pipeline of commands (stdout of one to stdin of the next) as data, with optional per-link stream routing, so you are not hand-wiring `Readable`/`Writable` between raw `ChildProcess` instances.

Vanilla:
Vanilla

```ts
import { spawn } from "node:child_process";

const cat = spawn("cat", ["/path/to/file"], { stdio: ["ignore", "pipe", "ignore"] });
const grep = spawn("grep", ["pattern"], { stdio: ["pipe", "pipe", "inherit"] });
cat.stdout?.pipe(grep.stdin!);
// … must coordinate exit, errors, and backpressure on every hop …
```

Effect:

```ts
import { NodeServices } from "@effect/platform-node";
import { Effect, Stream } from "effect";
import { ChildProcess } from "effect/unstable/process";

const pipeline = ChildProcess.make`cat /path/to/file`.pipe(
  ChildProcess.pipeTo(ChildProcess.make`grep pattern`),
);

const program = Effect.gen(function* () {
  const handle = yield* pipeline;
  return yield* Stream.runCollect(handle.stdout);
}).pipe(Effect.scoped, Effect.provide(NodeServices.layer));
```

### `ChildProcessSpawner`

`ChildProcessSpawner` is the `ChildProcess` runtime service: call `spawn` for a `ChildProcessHandle`, or use helpers such as `string` and `lines` to run a `Command` and collect output without reimplementing stream draining.

Vanilla:
Vanilla

```ts
import { spawn } from "node:child_process";
import { once } from "node:events";

const child = spawn("sh", ["-c", "echo $PATH"], { stdio: ["ignore", "pipe", "inherit"] });
const [out] = await once(child.stdout!, "data");
const text = out.toString("utf8");
```

Effect:

```ts
import { NodeServices } from "@effect/platform-node";
import { Effect } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";

const program = Effect.gen(function* () {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const pathLine = yield* spawner.lines(ChildProcess.make`sh -c "echo $PATH"`);
  const version = yield* spawner.string(ChildProcess.make("node", ["--version"]));
  return { pathLine, version };
}).pipe(Effect.provide(NodeServices.layer));
```

### `NodeChildProcessSpawner.layer`

`NodeChildProcessSpawner.layer` is the Node implementation of `ChildProcessSpawner` (maps `Command` to `node:child_process` under a single layer), and requires the Node `FileSystem` and `Path` services it uses to resolve `cwd` and similar options.

Vanilla:
Vanilla

```ts
import { spawn } from "node:child_process";

const child = spawn("pwd", { cwd: "/tmp", stdio: ["ignore", "pipe", "inherit"] });
```

Effect:

```ts
import { NodeChildProcessSpawner, NodeFileSystem, NodePath } from "@effect/platform-node";
import * as Layer from "effect/Layer";
import { Effect } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";

const layer = NodeChildProcessSpawner.layer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

const program = Effect.gen(function* () {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  return yield* spawner.exitCode(ChildProcess.make({ cwd: "/tmp" })`pwd`);
}).pipe(Effect.provide(layer));
```

### `NodeServices.layer`

`NodeServices.layer` is the default Node “bundle” that merges the Node `ChildProcessSpawner` with `FileSystem`, `Path`, `Stdio`, and `Terminal`, which matches what most CLI-style programs need when they `provide` a single environment for `ChildProcess` and related platform modules.

Vanilla:
Vanilla

```ts
import { spawn } from "node:child_process";

const whoami = spawn("whoami", { stdio: ["ignore", "pipe", "inherit"] });
```

Effect:

```ts
import { NodeServices } from "@effect/platform-node";
import { Console, Effect } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";

const program = Effect.gen(function* () {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const name = yield* spawner.string(ChildProcess.make`whoami`);
  yield* Console.log(name.trim());
}).pipe(Effect.provide(NodeServices.layer));
```

### `NodeWorker`

`NodeWorker.layer` composes `Worker.layerSpawner` and `NodeWorker.layerPlatform` so each logical worker id is backed by a `worker_threads.Worker` or a `child_process` fork (the Node platform handles IPC, exit, and cleanup)—use it when you would otherwise call `child_process.fork` or build `worker_threads.Worker` instances yourself to offload work to another V8 isolate or Node process.

Vanilla:

Vanilla
import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";

const child = fork(fileURLToPath(new URL("./task.cjs", import.meta.url)));
child.send({ n: 1 });

````

Effect:

```ts
import { NodeWorker } from "@effect/platform-node"
import { Worker } from "node:worker_threads"

// Same split-process idea; Effect’s worker platform owns the lifecycle.
const workers = NodeWorker.layer((id) =>
  new Worker(new URL(`./task-${id}.mjs`, import.meta.url), { type: "module" })
)
void workers
````

### `Worker.layerSpawner`

`Worker.layerSpawner` is the narrow layer that registers how `WorkerPlatform` should obtain each raw `Worker` or `ChildProcess` for a given id; `NodeWorker.layer` is exactly `Layer.merge(Worker.layerSpawner(spawn), layerPlatform)`, so you only use `layerSpawner` on its own when you supply a custom `WorkerPlatform` or recompose the stack. The `child_process` API does not model fork IPC the way a dedicated worker + platform pair does, which is why this path pairs with `NodeWorker` for fork-style workloads.

Vanilla:

Vanilla
import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";

const w0 = fork(fileURLToPath(new URL("./worker.cjs", import.meta.url)));

````

Effect:

```ts
import { NodeWorker } from "@effect/platform-node"
import { Worker } from "node:worker_threads"
import * as Layer from "effect/Layer"
import * as EffWorker from "effect/unstable/workers/Worker"

// Equivalent to `NodeWorker.layer((id) => new Worker(...))` for this stack shape.
const sameAsNodeWorker = Layer.merge(
  EffWorker.layerSpawner((id) =>
    new Worker(new URL(`./worker-${id}.mjs`, import.meta.url), { type: "module" })
  ),
  NodeWorker.layerPlatform
)
void sameAsNodeWorker
````
