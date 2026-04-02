import { createRule } from "../utils/create-rule.js";

export default createRule({
  name: "no-nullish-coalescing",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow `??` in favor of explicit Effect-friendly branching.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noNullishCoalescing:
        "Prefer explicit branching over JavaScript nullish coalescing.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      LogicalExpression(node) {
        if (node.operator !== "??") {
          return;
        }

        context.report({
          node,
          messageId: "noNullishCoalescing",
        });
      },
    };
  },
});
