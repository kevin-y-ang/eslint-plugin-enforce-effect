# @kevin-y-ang/eslint-plugin-enforce-effect

Skeleton ESLint plugin repo for Effect-oriented TypeScript lint rules.

## Included

- Flat-config plugin entrypoint with `meta.name`, `meta.version`, and `meta.namespace`
- `RuleCreator` helper with docs URLs
- One error rule: `enforce-effect/no-error`
- One typing rule: `enforce-effect/no-explicit-function-return-type`
- One iteration rule: `enforce-effect/no-for`
- One parsing rule: `enforce-effect/no-json-parse`
- One absence rule: `enforce-effect/no-null`
- One fallback rule: `enforce-effect/no-nullish-coalescing`
- One platform rule: `enforce-effect/no-node-child-process`
- One access rule: `enforce-effect/no-optional-chaining`
- One example rule: `enforce-effect/no-promise`
- One configuration rule: `enforce-effect/no-process-env`
- One branching rule: `enforce-effect/no-switch`
- One Effect error rule: `enforce-effect/no-throw`
- One typing rule: `enforce-effect/no-type-assertion`
- One Effect control-flow rule: `enforce-effect/no-try`
- One absence rule: `enforce-effect/no-undefined`
- One accountability config: `enforce-effect.configs.accountability`
- `recommended` plus an empty `recommendedTypeChecked` placeholder config
- Vitest + `@typescript-eslint/rule-tester` test setup
- TypeScript build output to `dist/`

## Install

```sh
npm install eslint typescript @typescript-eslint/parser @kevin-y-ang/eslint-plugin-enforce-effect
```

For local development in this repo:

```sh
npm install
npm run check
```

## Usage

```ts
import { defineConfig } from "eslint/config";
import enforceEffect from "@kevin-y-ang/eslint-plugin-enforce-effect";

export default defineConfig([
  ...enforceEffect.configs.recommended,
]);
```

To enable the accountability rules ported from your other repo:

```ts
import { defineConfig } from "eslint/config";
import enforceEffect from "@kevin-y-ang/eslint-plugin-enforce-effect";

export default defineConfig([
  ...enforceEffect.configs.accountability,
]);
```

`recommendedTypeChecked` is intentionally empty in this skeleton. Once you add
typed rules, place them there and enable that config separately:

```ts
import { defineConfig } from "eslint/config";
import enforceEffect from "eslint-plugin-enforce-effect";

export default defineConfig([
  ...enforceEffect.configs.recommended,
  ...enforceEffect.configs.recommendedTypeChecked,
]);
```

## CLI fixtures

The repo includes real TypeScript fixtures under `fixtures/` so you can run the
plugin through the ESLint CLI instead of only through `RuleTester`.

```sh
npm run test:fixtures
```

That Vitest suite builds `dist/`, runs the real ESLint CLI against the fixture
directories, asserts that `fixtures/valid` passes cleanly, and asserts that
`fixtures/invalid` fails with the expected rule diagnostics.

## Structure

```text
src/
  index.ts
  rules/
  utils/
tests/
docs/rules/
```

## Next steps

1. Replace the sample `no-promise` rule with real Effect rules.
2. Update the docs base URL in `src/utils/create-rule.ts` if your repository URL differs.
3. Add typed rules and move them into `recommendedTypeChecked`.
