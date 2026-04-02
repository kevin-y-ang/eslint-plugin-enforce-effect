# `no-json-parse`

Disallow `JSON.parse` in favor of validated decoding.

## Why?

Effect-oriented codebases usually prefer JSON input to be decoded and validated
through explicit schemas rather than parsed directly into unchecked values.

## Examples

Examples of **incorrect** code for this rule:

```ts
const parsed = JSON.parse(input);
```

Examples of **correct** code for this rule:

```ts
const parsed = Schema.decodeUnknownSync(Config)(input);
```

```ts
const parsed = parser.parse(input);
```
