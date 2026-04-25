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
        "The user prefers `Schema.decodeUnknown` over vanilla TypeScript `as` type assertions. If this logic cannot be implemented with `Schema.decodeUnknown`, use `// eslint-disable-next-line no-type-assertion -- <justification>` as a LAST RESORT. The justification MUST explain why `Schema.decodeUnknown` doesn't accomplish your goal, and MUST be no less than 40 characters.",
      noAngleAssertion:
        "The user prefers `Schema.decodeUnknown` over vanilla TypeScript `<Type>` angle-bracket type assertions. If this logic cannot be implemented with `Schema.decodeUnknown`, use `// eslint-disable-next-line no-type-assertion -- <justification>` as a LAST RESORT. The justification MUST explain why `Schema.decodeUnknown` doesn't accomplish your goal, and MUST be no less than 40 characters.",
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
