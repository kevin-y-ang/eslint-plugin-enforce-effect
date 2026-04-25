import { Effect } from "effect";

Effect.fn(function* () {
  yield* Effect.succeed(1);
});
