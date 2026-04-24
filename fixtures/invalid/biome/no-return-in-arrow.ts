import { Effect } from "effect";

declare const task: Effect.Effect<number>;

Effect.map(task, (value) => {
  return value + 1;
});
