import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "no-type-assertion",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow TypeScript type assertions in favor of validated narrowing.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noAsAssertion:
        "The user prefers Effect primitives like `Schema.decodeUnknownEffect()` / `Schema.decodeUnknownSync()` (parsing unknown data at boundaries), `Schema.is` / `Schema.asserts` (schema-driven narrowing), `Schema.brand` / `Schema.fromBrand` / `Schema.refine` together with the schema's `.make()` constructor (constructing branded or refined types with validation), `Option.some<T>()` / `Option.none<T>()` (explicit `Option` types), `identity<T>()` from `effect/Function` (compile-time type verification without an unsafe cast), `Match.type` with `Match.exhaustive` (for discriminated unions), or proper generics / type parameters, over vanilla TypeScript `as` type assertions. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-type-assertion -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
      noAngleAssertion:
        "The user prefers Effect primitives like `Schema.decodeUnknownEffect()` / `Schema.decodeUnknownSync()` (parsing unknown data at boundaries), `Schema.is` / `Schema.asserts` (schema-driven narrowing), `Schema.brand` / `Schema.fromBrand` / `Schema.refine` together with the schema's `.make()` constructor (constructing branded or refined types with validation), `Option.some<T>()` / `Option.none<T>()` (explicit `Option` types), `identity<T>()` from `effect/Function` (compile-time type verification without an unsafe cast), `Match.type` with `Match.exhaustive` (for discriminated unions), or proper generics / type parameters, over vanilla TypeScript `<Type>` angle-bracket type assertions. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-type-assertion -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      TSAsExpression(node) {
        context.report({
          node,
          messageId: "noAsAssertion",
        });
      },
      TSTypeAssertion(node) {
        context.report({
          node,
          messageId: "noAngleAssertion",
        });
      },
    };
  },
});
