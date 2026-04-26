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
        "The user prefers Effect primitives like `Schema.is`, `Schema.asserts`, `Predicate.isString`, `Predicate.hasProperty`, `Predicate.isTagged`, `Schema.decodeUnknownEffect`, `Schema.decodeUnknownSync`, `Schema.decodeUnknownResult`, `Schema.brand`, `Schema.fromBrand`, `Schema.refine` + `.make()`, `Option.some<T>()`, `Option.none<T>()`, `Match.type` + `Match.exhaustive`, proper generics / type parameters, or `identity<T>()` from `effect/Function` (a no-op at runtime that asserts the value's type at compile time without an unsafe cast), over vanilla TypeScript `as` type assertions. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-type-assertion -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters. See /Users/bytedance/eslint-plugin-enforce-effect/docs/rules/no-type-assertion.md",
      noAngleAssertion:
        "The user prefers Effect primitives like `Schema.is`, `Schema.asserts`, `Predicate.isString`, `Predicate.hasProperty`, `Predicate.isTagged`, `Schema.decodeUnknownEffect`, `Schema.decodeUnknownSync`, `Schema.decodeUnknownResult`, `Schema.brand`, `Schema.fromBrand`, `Schema.refine` + `.make()`, `Option.some<T>()`, `Option.none<T>()`, `Match.type` + `Match.exhaustive`, proper generics / type parameters, or `identity<T>()` from `effect/Function` (a no-op at runtime that asserts the value's type at compile time without an unsafe cast), over vanilla TypeScript `<Type>` angle-bracket type assertions. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-type-assertion -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters. See /Users/bytedance/eslint-plugin-enforce-effect/docs/rules/no-type-assertion.md",
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
