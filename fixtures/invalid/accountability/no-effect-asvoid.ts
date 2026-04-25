import { Effect } from "effect";

declare const task: Effect.Effect<number>;

export const silenced = task.pipe(Effect.asVoid);
