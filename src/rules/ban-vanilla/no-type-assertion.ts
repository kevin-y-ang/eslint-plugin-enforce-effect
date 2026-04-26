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
        "The user prefers Effect primitives like `Schema.decodeUnknownEffect`, `Schema.decodeUnknownResult`, `Schema.decodeUnknownExit`, `Schema.decodeUnknownOption`, `Schema.decodeUnknownPromise`, `Schema.decodeUnknownSync`, `Schema.is`, `Schema.asserts`, `Schema.refine` + `.make()`, `Schema.brand`, `Schema.fromBrand`, `Predicate.isString`, `Predicate.isNumber`, `Predicate.isBoolean`, `Predicate.hasProperty`, `Predicate.isTagged`, `Match.type` + `Match.exhaustive`, `Option.some<T>()`, `Option.none<T>()`, proper generics / type parameters, or `identity<T>()` from `effect/Function` (a no-op at runtime that asserts the value's type at compile time without an unsafe cast), over vanilla TypeScript `as` type assertions.  See /Users/bytedance/eslint-plugin-enforce-effect/docs/rules/no-type-assertion.md",
      noAngleAssertion:
        "The user prefers Effect primitives like `Schema.decodeUnknownEffect`, `Schema.decodeUnknownResult`, `Schema.decodeUnknownExit`, `Schema.decodeUnknownOption`, `Schema.decodeUnknownPromise`, `Schema.decodeUnknownSync`, `Schema.is`, `Schema.asserts`, `Schema.refine` + `.make()`, `Schema.brand`, `Schema.fromBrand`, `Predicate.isString`, `Predicate.isNumber`, `Predicate.isBoolean`, `Predicate.hasProperty`, `Predicate.isTagged`, `Match.type` + `Match.exhaustive`, `Option.some<T>()`, `Option.none<T>()`, proper generics / type parameters, or `identity<T>()` from `effect/Function` (a no-op at runtime that asserts the value's type at compile time without an unsafe cast), over vanilla TypeScript `<Type>` angle-bracket type assertions.  See /Users/bytedance/eslint-plugin-enforce-effect/docs/rules/no-type-assertion.md",
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
