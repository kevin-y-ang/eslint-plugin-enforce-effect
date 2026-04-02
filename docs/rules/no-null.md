# `no-null`

Disallow JavaScript `null` and TypeScript `null` types in favor of explicit
absence models.

## Why?

Effect-oriented codebases generally prefer absence and failure to be modeled
explicitly. `null` introduces another ambient sentinel value that is easy to
forget to handle.

## Examples

Examples of **incorrect** code for this rule:

```ts
const value = null;
```

```ts
type MaybeValue = string | null;
```

Examples of **correct** code for this rule:

```ts
const value = Option.none();
```

```ts
type MaybeValue = string | undefined;
```
