import { createRule } from "../utils/create-rule.js";

export default createRule({
  name: "no-optional-chaining",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow optional chaining in favor of explicit branching.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noOptionalChaining:
        "Prefer explicit branching over JavaScript optional chaining.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ChainExpression(node) {
        context.report({
          node,
          messageId: "noOptionalChaining",
        });
      },
    };
  },
});
