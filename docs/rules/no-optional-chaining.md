# `no-optional-chaining`

Disallow JavaScript optional chaining in favor of explicit branching.

## Why?

Effect-oriented codebases often prefer control flow to stay explicit so absence
checks and failure paths are visible in the program shape.

## Examples

Examples of **incorrect** code for this rule:

```ts
const value = user?.profile;
```

```ts
const result = fn?.();
```

Examples of **correct** code for this rule:

```ts
const value = user ? user.profile : undefined;
```

```ts
const result = fn ? fn() : fallback;
```
