import { Effect } from "effect";

declare const sideEffect: (value: number) => void;
declare const value: number;

Effect.sync(() => sideEffect(value));
