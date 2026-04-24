import { Match } from "effect";

declare const value: unknown;

const isBoolean = typeof value === "boolean";

Match.orElse(() => null);

void isBoolean;
