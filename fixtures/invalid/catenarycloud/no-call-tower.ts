import { Effect } from "effect";

Effect.map(Effect.succeed(1), (value) => value + 1);
