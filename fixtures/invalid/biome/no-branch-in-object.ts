import { Option } from "effect";

declare const input: Option.Option<number>;

export const result = {
  current: Option.match(input, {
    onNone: () => 0,
    onSome: (value) => value,
  }),
};
