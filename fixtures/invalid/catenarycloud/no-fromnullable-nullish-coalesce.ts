import { Option } from "effect";

declare const input: number | undefined;

Option.fromNullable(input ?? null);
