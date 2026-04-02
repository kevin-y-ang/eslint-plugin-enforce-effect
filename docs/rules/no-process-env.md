# `no-process-env`

Disallow direct `process.env` access in favor of explicit configuration.

## Why?

Effect-oriented codebases usually prefer configuration to be loaded, validated,
and injected explicitly. Reading from `process.env` inline makes configuration
ambient and harder to test.

## Examples

Examples of **incorrect** code for this rule:

```ts
const env = process.env;
```

```ts
const nodeEnv = process.env.NODE_ENV;
```

Examples of **correct** code for this rule:

```ts
const nodeEnv = Config.string("NODE_ENV");
```

```ts
const env = runtimeConfig.env;
```
