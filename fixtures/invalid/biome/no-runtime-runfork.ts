import { Effect, Runtime } from "effect";

declare const runtime: Runtime.Runtime<never>;
declare const task: Effect.Effect<number>;

Runtime.runFork(runtime, task);
