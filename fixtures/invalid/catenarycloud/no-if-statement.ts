import { Effect } from "effect";

declare const input: boolean;

if (input) {
  Effect.succeed(1);
}
