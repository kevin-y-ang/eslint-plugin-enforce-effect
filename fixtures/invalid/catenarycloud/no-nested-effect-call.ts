import { Effect } from "effect";

Effect.flatMap(
  Effect.map(Effect.succeed(1), (value) => value),
  () => Effect.succeed(2),
);
