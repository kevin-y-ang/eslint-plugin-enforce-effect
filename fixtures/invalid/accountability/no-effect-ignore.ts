import { Effect } from "effect";

declare const task: Effect.Effect<number>;

export const suppressed = task.pipe(Effect.ignore);
