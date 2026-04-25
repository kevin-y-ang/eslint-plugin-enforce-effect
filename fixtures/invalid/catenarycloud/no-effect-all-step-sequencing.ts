import { Effect, Ref } from "effect";

declare const counter: Ref.Ref<number>;

Effect.all([Ref.set(counter, 1)], { concurrency: 1 });
