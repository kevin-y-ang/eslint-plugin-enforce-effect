# `no-error`

Disallow `Error` constructor calls and `Error` type references.

## Why?

Effect-oriented codebases often prefer domain-specific failure values and error
types over the ambient JavaScript `Error` constructor and the built-in `Error`
type.

## Examples

Examples of **incorrect** code for this rule:

```ts
throw new Error("boom");
```

```ts
const error: Error = issue;
```

Examples of **correct** code for this rule:

```ts
return Effect.fail({ _tag: "Failure", message: "boom" });
```

```ts
type Failure = { readonly _tag: "Failure"; readonly message: string };
```
