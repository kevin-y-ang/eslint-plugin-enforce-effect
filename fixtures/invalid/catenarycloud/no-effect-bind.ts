import { Effect } from "effect";

declare const program: { value: number };

Effect.bind(program, "value", () => Effect.succeed(1));
