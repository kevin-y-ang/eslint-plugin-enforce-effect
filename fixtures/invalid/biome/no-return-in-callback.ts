import { Effect } from "effect";

declare const task: Effect.Effect<number>;

Effect.flatMap(task, function (value) {
  return Effect.succeed(value);
});
