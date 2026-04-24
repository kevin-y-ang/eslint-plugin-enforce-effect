import { Effect } from "effect";

Effect.flatMap(Effect.succeed(1), (value) => Effect.succeed(value));
