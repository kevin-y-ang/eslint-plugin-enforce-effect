import { Effect } from "effect";

declare const work: () => void;
declare const handle: (error: unknown) => void;

void Effect.void;

try {
  work();
} catch (error) {
  handle(error);
}
