import { Effect } from "effect";

declare const setState: (value: number) => void;
declare const value: number;

Effect.as(setState(value), 1);
