# `no-type-assertion`

Disallow TypeScript type assertions in favor of validated narrowing.

## Why?

Effect-oriented codebases usually prefer runtime validation, schema decoding,
and explicit narrowing over unchecked assertions that can hide invalid data.

## Examples

Examples of **incorrect** code for this rule:

```ts
const value = input as string;
```

```ts
const value = <string>input;
```

Examples of **correct** code for this rule:

```ts
if (typeof input === "string") {
  consume(input);
}
```

```ts
const user = Schema.decodeUnknownSync(User)(input);
```
