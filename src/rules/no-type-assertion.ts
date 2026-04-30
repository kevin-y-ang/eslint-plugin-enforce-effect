import { createRule } from "../utils/create-rule.js";

const PRIMITIVES_LIST =
  "`Schema.decodeUnknownEffect`, `Schema.decodeUnknownResult`, `Schema.decodeUnknownExit`, `Schema.decodeUnknownOption`, `Schema.decodeUnknownPromise`, `Schema.decodeUnknownSync`, `Schema.is`, `Schema.asserts`, `Schema.refine` + `.make()`, `Schema.brand`, `Schema.fromBrand`, `Predicate.isString`, `Predicate.isNumber`, `Predicate.isBoolean`, `Predicate.hasProperty`, `Predicate.isTagged`, `Match.type` + `Match.exhaustive`, `Option.some<T>()`, `Option.none<T>()`, proper generics / type parameters, or `identity<T>()` from `effect/Function` (a no-op at runtime that asserts the value's type at compile time without an unsafe cast)";

export default createRule({
  name: "no-type-assertion",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow TypeScript type assertions and redundant variable type annotations in favor of inference and validated narrowing.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noAsAssertion: `The user prefers Effect primitives like ${PRIMITIVES_LIST}, over vanilla TypeScript \`as\` type assertions. `,
      noAngleAssertion: `The user prefers Effect primitives like ${PRIMITIVES_LIST}, over vanilla TypeScript \`<Type>\` angle-bracket type assertions. `,
      noVariableTypeAnnotation: `The user prefers letting TypeScript infer variable types from initializers. \`const x: T = value\` (and the equivalent \`let\`/\`var\` forms) is effectively a type assertion when the annotation is wider or different than the inferred type, and is otherwise redundant. Drop the annotation and rely on inference, or, if you need a runtime check, reach for Effect primitives like ${PRIMITIVES_LIST}. Annotations on declarations without an initializer (e.g. \`let x: T;\`) and on function parameters are still allowed because TypeScript cannot infer those.`,
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
      VariableDeclarator(node) {
        const annotation = node.id.typeAnnotation;
        if (annotation && node.init) {
          context.report({
            node: annotation,
            messageId: "noVariableTypeAnnotation",
          });
        }
      },
    };
  },
});
