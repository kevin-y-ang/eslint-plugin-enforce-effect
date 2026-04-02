# `no-promise`

Disallow direct Promise APIs in favor of Effect-based abstractions.

## Why?

Teams adopting Effect often want a single async/error model. Using `Promise`
directly can bypass Effect helpers, tracing, interruption, and shared
conventions.

## Examples

Examples of **incorrect** code for this rule:

```ts
new Promise((resolve) => resolve(1));
Promise.resolve(1);
Promise.all(tasks);
loadConfig().then(handle);
await loadConfig();
```

Examples of **correct** code for this rule:

```ts
Effect.succeed(1);
Effect.all(tasks);
yield* loadConfigEffect;
```
