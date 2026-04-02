import { createRule } from "../utils/create-rule.js";

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
      noTypeAssertion:
        "Prefer validated narrowing over TypeScript type assertions.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      TSAsExpression(node) {
        context.report({
          node,
          messageId: "noTypeAssertion",
        });
      },
      TSTypeAssertion(node) {
        context.report({
          node,
          messageId: "noTypeAssertion",
        });
      },
    };
  },
});
