import { Effect } from "effect";

declare const task: Effect.Effect<number>;

Effect.as(task, 1);
