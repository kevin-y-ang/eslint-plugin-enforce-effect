# `no-nullish-coalescing`

Disallow JavaScript nullish coalescing in favor of explicit branching.

## Why?

Effect-oriented codebases often prefer absence and fallback behavior to be made
explicit instead of hidden behind `??`.

## Examples

Examples of **incorrect** code for this rule:

```ts
const value = input ?? fallback;
```

Examples of **correct** code for this rule:

```ts
const value = input !== undefined ? input : fallback;
```

```ts
const value = Option.getOrElse(option, () => fallback);
```
