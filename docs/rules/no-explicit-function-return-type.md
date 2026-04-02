# `no-explicit-function-return-type`

Disallow explicit function return type annotations in favor of inference.

## Why?

Effect-oriented TypeScript codebases often prefer signatures to stay lightweight
when the return type can be inferred directly from the implementation.

## Examples

Examples of **incorrect** code for this rule:

```ts
function readValue(input: string): string {
  return input.trim();
}
```

```ts
const readValue = (input: string): string => input.trim();
```

Examples of **correct** code for this rule:

```ts
function readValue(input: string) {
  return input.trim();
}
```

```ts
const readValue = (input: string) => input.trim();
```
