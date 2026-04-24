import { Effect, Option } from "effect";

declare const input: Option.Option<number>;
declare const task: Effect.Effect<number>;

Option.match(input, {
  onNone: () => Effect.void,
  onSome: () => Effect.flatMap(task, (value) => Effect.succeed(value)),
});
