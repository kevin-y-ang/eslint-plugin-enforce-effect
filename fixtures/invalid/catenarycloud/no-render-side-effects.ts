import { Effect, Match } from "effect";

declare const input: string;

Match.value(input).pipe(
  Match.when("ready", () => Effect.succeed(1)),
  Match.orElse(() => Effect.void),
);
