# `no-try`

Disallow JavaScript `try` blocks in favor of Effect-based error handling.

## Why?

Effect-based codebases usually want failures to flow through Effect values rather
than imperative exception handling. `try` blocks make that control flow implicit
and harder to compose consistently.

## Examples

Examples of **incorrect** code for this rule:

```ts
try {
  work();
} catch (error) {
  handle(error);
}
```

```ts
try {
  await work();
} finally {
  cleanup();
}
```

Examples of **correct** code for this rule:

```ts
const program = Effect.tryPromise(() => work());
```

```ts
const program = Effect.acquireUseRelease(acquire, use, release);
```
