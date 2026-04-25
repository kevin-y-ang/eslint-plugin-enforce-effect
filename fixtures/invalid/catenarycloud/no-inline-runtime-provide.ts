import { Effect, Layer } from "effect";

declare const SomeRuntime: any;
declare const SomeRuntimeLive: Layer.Layer<never>;

function* run() {
  yield* SomeRuntime.pipe(Effect.provide(SomeRuntimeLive));
}

void run;
