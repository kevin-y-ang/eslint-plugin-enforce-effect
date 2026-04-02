import { createRule } from "../utils/create-rule.js";

export default createRule({
  name: "no-for",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow `for` loops in favor of explicit iteration helpers.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noFor:
        "Prefer explicit iteration helpers over JavaScript `for` loops.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ForStatement(node) {
        context.report({
          node,
          messageId: "noFor",
        });
      },
      ForInStatement(node) {
        context.report({
          node,
          messageId: "noFor",
        });
      },
      ForOfStatement(node) {
        context.report({
          node,
          messageId: "noFor",
        });
      },
    };
  },
});
