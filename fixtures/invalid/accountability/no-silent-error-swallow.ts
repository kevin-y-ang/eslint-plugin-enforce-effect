import { Effect } from "effect";

declare const task: Effect.Effect<number, Error>;

export const guarded = task.pipe(Effect.catchAll(() => Effect.void));
