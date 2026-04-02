# `no-switch`

Disallow JavaScript `switch` statements in favor of explicit branching.

## Why?

Effect-oriented codebases often prefer branch logic to be written in ways that
compose more directly with expressions, handlers, and explicit control flow.

## Examples

Examples of **incorrect** code for this rule:

```ts
switch (tag) {
  case "a":
    return 1;
  default:
    return 2;
}
```

Examples of **correct** code for this rule:

```ts
if (tag === "a") {
  return 1;
}

return 2;
```

```ts
return handlers[tag]();
```
