import { Effect } from "effect";

declare const task: Effect.Effect<number>;
declare const fallback: Effect.Effect<number>;

Effect.orElse(
  Effect.flatMap(task, (value) => Effect.succeed(value)),
  () => fallback,
);
