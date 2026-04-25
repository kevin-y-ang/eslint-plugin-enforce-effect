import { pipe } from "effect/Function";

declare const value: number;
declare const fn1: (input: number) => number;

pipe(value, (current) => pipe(current, fn1));
