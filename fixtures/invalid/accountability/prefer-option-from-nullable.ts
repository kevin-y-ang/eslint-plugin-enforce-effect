import { Option } from "effect";

declare const input: string | null;

export const wrapped = input !== null ? Option.some(input) : Option.none();
