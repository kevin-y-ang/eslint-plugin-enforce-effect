# `@kevin-y-ang/eslint-plugin-enforce-effect`

An ESLint plugin that nudges TypeScript codebases toward
[Effect](https://effect.website)-oriented patterns by banning the vanilla JS
escape hatches that Effect already provides typed, traced, and interruptible
replacements for.

Each rule answers two questions in its docs:

1. **Why?** What does the vanilla pattern make hard (tracing, error channels,
   interruption, structured logging, validated decoding, …)?
2. **How?** Which Effect primitive replaces it, with side-by-side
   vanilla-vs-Effect snippets.

## Installation

This package is published to the GitHub Packages registry under the
`@kevin-y-ang` scope.

```bash
npm install --save-dev @kevin-y-ang/eslint-plugin-enforce-effect
```

Configure npm to fetch the `@kevin-y-ang` scope from GitHub Packages by adding
to your `.npmrc`:

```ini
@kevin-y-ang:registry=https://npm.pkg.github.com
```

### Peer dependencies

| Peer                          | Range                              |
| ----------------------------- | ---------------------------------- |
| `eslint`                      | `^8.57.0 \|\| ^9.0.0 \|\| ^10.0.0` |
| `@typescript-eslint/parser`   | `^8.59.0`                          |
| `typescript`                  | `>=4.8.4 <6.1.0`                   |

Node `^20.19.0 || ^22.13.0 || >=24` is required.

## Usage

The plugin ships flat-config presets. In your `eslint.config.js` (or
`.mjs` / `.ts`):

```js
import tsParser from "@typescript-eslint/parser";
import enforceEffect from "@kevin-y-ang/eslint-plugin-enforce-effect";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
  ...enforceEffect.configs.recommended,
];
```

### Type-aware preset

Several rules have a stricter type-aware sibling that catches values whose
inferred type is `Promise<…>`, `Date`, `Error`, `null`, or `undefined` even
when the literal identifier never appears at the call site. Opt into them via
`recommendedTypeChecked`, which **swaps** the syntactic rule for its
`*-type-checked` superset (it does not run both):

```js
import tsParser from "@typescript-eslint/parser";
import enforceEffect from "@kevin-y-ang/eslint-plugin-enforce-effect";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...enforceEffect.configs.recommendedTypeChecked,
];
```

Type-aware rules require `parserOptions.project` or `parserOptions.projectService`
to be configured.

### Manual rule selection

If you do not want either preset, pull in the plugin and enable rules
individually:

```js
import enforceEffect from "@kevin-y-ang/eslint-plugin-enforce-effect";

export default [
  {
    plugins: { "enforce-effect": enforceEffect },
    rules: {
      "enforce-effect/no-promise": "error",
      "enforce-effect/no-throw": "error",
      "enforce-effect/no-try": "error",
    },
  },
];
```

## Configs

| Config                   | Includes                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `recommended`            | All syntactic rules. Cheap; no type information required.                                                                             |
| `recommendedTypeChecked` | The same set, but each rule with a type-aware superset (`no-date`, `no-error`, `no-null`, `no-promise`, `no-undefined`) is swapped in. |

## Rules

All rule docs live in [`docs/rules`](./docs/rules). Each rule is enabled in
`recommended` (and / or `recommendedTypeChecked`) as marked.

### Async & error model

| Rule                                                                       | Recommended | Type-checked |
| -------------------------------------------------------------------------- | :---------: | :----------: |
| [`no-promise`](./docs/rules/no-promise.md)                                 |     ✓       |              |
| [`no-promise-type-checked`](./docs/rules/no-promise-type-checked.md)       |             |      ✓       |
| [`no-throw`](./docs/rules/no-throw.md)                                     |     ✓       |      ✓       |
| [`no-try`](./docs/rules/no-try.md)                                         |     ✓       |      ✓       |
| [`no-error`](./docs/rules/no-error.md)                                     |     ✓       |              |
| [`no-error-type-checked`](./docs/rules/no-error-type-checked.md)           |             |      ✓       |

### Absence & narrowing

| Rule                                                                       | Recommended | Type-checked |
| -------------------------------------------------------------------------- | :---------: | :----------: |
| [`no-null`](./docs/rules/no-null.md)                                       |     ✓       |              |
| [`no-null-type-checked`](./docs/rules/no-null-type-checked.md)             |             |      ✓       |
| [`no-undefined`](./docs/rules/no-undefined.md)                             |     ✓       |              |
| [`no-undefined-type-checked`](./docs/rules/no-undefined-type-checked.md)   |             |      ✓       |
| [`no-nullish-coalescing`](./docs/rules/no-nullish-coalescing.md)           |     ✓       |      ✓       |
| [`no-optional-chaining`](./docs/rules/no-optional-chaining.md)             |     ✓       |      ✓       |
| [`no-type-assertion`](./docs/rules/no-type-assertion.md)                   |     ✓       |      ✓       |
| [`no-explicit-function-return-type`](./docs/rules/no-explicit-function-return-type.md) | ✓ | ✓     |

### Control flow

| Rule                                                | Recommended | Type-checked |
| --------------------------------------------------- | :---------: | :----------: |
| [`no-for`](./docs/rules/no-for.md)                  |     ✓       |      ✓       |
| [`no-switch`](./docs/rules/no-switch.md)            |     ✓       |      ✓       |

### Side effects & ambient APIs

| Rule                                                                  | Recommended | Type-checked |
| --------------------------------------------------------------------- | :---------: | :----------: |
| [`no-console`](./docs/rules/no-console.md)                            |     ✓       |      ✓       |
| [`no-crypto`](./docs/rules/no-crypto.md)                              |     ✓       |      ✓       |
| [`no-date`](./docs/rules/no-date.md)                                  |     ✓       |              |
| [`no-date-type-checked`](./docs/rules/no-date-type-checked.md)        |             |      ✓       |
| [`no-fs`](./docs/rules/no-fs.md)                                      |     ✓       |      ✓       |
| [`no-json-parse`](./docs/rules/no-json-parse.md)                      |     ✓       |      ✓       |
| [`no-json-stringify`](./docs/rules/no-json-stringify.md)              |     ✓       |      ✓       |
| [`no-math-random`](./docs/rules/no-math-random.md)                    |     ✓       |      ✓       |
| [`no-node-child-process`](./docs/rules/no-node-child-process.md)      |     ✓       |      ✓       |
| [`no-performance-now`](./docs/rules/no-performance-now.md)            |     ✓       |      ✓       |
| [`no-process-env`](./docs/rules/no-process-env.md)                    |     ✓       |      ✓       |
| [`no-timers`](./docs/rules/no-timers.md)                              |     ✓       |      ✓       |
| [`no-fetch`](./docs/rules/no-fetch.md)                                |     ✓       |      ✓       |

### Meta

| Rule                                                                                       | Recommended | Type-checked |
| ------------------------------------------------------------------------------------------ | :---------: | :----------: |
| [`require-eslint-disable-justification`](./docs/rules/require-eslint-disable-justification.md) |     ✓       |      ✓       |

## Type-aware vs syntactic rules

For each of `no-date`, `no-error`, `no-null`, `no-promise`, and
`no-undefined`, the `*-type-checked` sibling is a strict **superset**: it
runs the same syntactic visitor and *also* asks the TypeScript checker about
the type at each value-bearing position (variable declarators, class fields,
function parameters, function return types, …). Enable **one or the other**,
not both — running both would produce duplicate reports.

The `recommendedTypeChecked` preset already handles the swap for you.

## Inline disabling

When a vanilla escape hatch is genuinely needed (most often at the runtime
boundary, e.g. `Effect.runPromise`), suppress the rule inline with a
justification:

```ts
// eslint-disable-next-line enforce-effect/no-promise -- runtime boundary:
//   the only place we hand the Effect off to the JS event loop.
const result = Effect.runPromise(program);
```

[`require-eslint-disable-justification`](./docs/rules/require-eslint-disable-justification.md)
will fail the lint if you forget the `-- reason` description.

### Post-edit lint hooks (`.claude/`)

`.claude/hooks.json` registers a `PostToolUse` hook that runs
`eslint --no-warn-ignored` against any JS/TS file Claude Code writes or edits
and feeds the violations back to the agent as additional context. The agent
then fixes the violation in the same loop.

Catching a vanilla-API regression inline — one Write/Edit at a time — is
meaningfully better than catching it at the end of a multi-file task. The
agent learns the Effect idiom for the rule it just tripped, and that style
choice propagates through subsequent edits. Late-stage cleanup, by contrast,
often means rewriting whole control-flow trees the agent already built
around `try` / `async` / `throw` / `null` / etc.

The hook script is configurable via `LINT_RUNTIME` and `LINT_CMD`, so it
works with `npx`, `pnpm exec`, `bunx`, oxlint, biome, etc. Drop the same
`.claude/` setup into a consumer repo to get the loop there too.

### `skills/`

The repo ships two skills that teach an agent how
to look up Effect APIs from the Effect source itself, rather than guessing or
round-tripping to the Effect website:

- [`skills/ask-effect-init`](./skills/ask-effect-init/SKILL.md) — shallow-clones the Effect source as `.reference/effect/` so subsequent skills have something to grep.
- [`skills/ask-effect`](./skills/ask-effect/SKILL.md) — answers "how do I use X?" Effect questions by searching that reference.

Together with the lint feedback loop above, these give an agent enough
in-context grounding to write idiomatic Effect on the first pass.

## Development

```bash
npm install
npm run check       # eslint + tsc + vitest
npm run test        # vitest only
npm run typecheck   # tsc --noEmit
npm run build       # emit dist/
```

## License

[MIT](./LICENSE)
