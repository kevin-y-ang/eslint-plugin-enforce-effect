# `no-undefined`

Disallow JavaScript `undefined` values in favor of explicit absence models.

## Why?

Effect-oriented codebases often prefer absence to be represented explicitly with
domain types rather than with ambient `undefined` values.

## Examples

Examples of **incorrect** code for this rule:

```ts
const value = undefined;
```

```ts
function missing(undefined: string) {
  return undefined;
}
```

Examples of **correct** code for this rule:

```ts
const value = Option.none();
```

```ts
const record = { undefined: 1 };
const value = record.undefined;
```
