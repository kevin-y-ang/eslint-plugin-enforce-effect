# `no-throw`

Disallow JavaScript `throw` statements in favor of Effect-based failure
channels.

## Why?

Effect-oriented codebases typically want failure to be modeled explicitly in
values instead of being raised as an exception. `throw` makes failure implicit
and bypasses the Effect error channel.

## Examples

Examples of **incorrect** code for this rule:

```ts
throw new Error("boom");
```

```ts
function fail(error: Error) {
  throw error;
}
```

Examples of **correct** code for this rule:

```ts
return Effect.fail(error);
```

```ts
return Effect.dieMessage("boom");
```
