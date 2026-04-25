import { Option } from "effect";

declare const input: Option.Option<boolean>;

Option.match(input, {
  onSome: (value) => value === true,
  onNone: () => false,
});
