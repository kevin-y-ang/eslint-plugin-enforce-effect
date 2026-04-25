import { Effect } from "effect";

declare const task: Effect.Effect<number>;
declare const otherTask: Effect.Effect<number>;

Effect.flatMap(task, () =>
  Effect.flatMap(otherTask, () => Effect.succeed(1)),
);
