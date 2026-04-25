import { Effect } from "effect";

declare const task: Effect.Effect<number>;
declare const recover: (cause: unknown) => Effect.Effect<number>;

export const guarded = task.pipe(Effect.catchAllCause(recover));
