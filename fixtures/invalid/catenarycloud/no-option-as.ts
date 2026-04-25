import { Option } from "effect";

declare const input: Option.Option<number>;

Option.as(input, 1);
