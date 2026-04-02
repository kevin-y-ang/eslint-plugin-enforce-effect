# `no-for`

Disallow JavaScript `for` loops in favor of explicit iteration helpers.

## Why?

Effect-oriented codebases often prefer iteration to be expressed with
combinators, traversals, and other explicit helpers instead of imperative loop
constructs.

## Examples

Examples of **incorrect** code for this rule:

```ts
for (let index = 0; index < items.length; index += 1) {
  work(items[index]);
}
```

```ts
for (const item of items) {
  work(item);
}
```

Examples of **correct** code for this rule:

```ts
items.map((item) => work(item));
```

```ts
Effect.forEach(items, work);
```
