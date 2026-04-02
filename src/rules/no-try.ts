import { createRule } from "../utils/create-rule.js";

export default createRule({
  name: "no-try",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow `try` blocks in favor of Effect-based error handling.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noTry:
        "Prefer Effect error handling primitives over JavaScript `try` blocks.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      TryStatement(node) {
        context.report({
          node,
          messageId: "noTry",
        });
      },
    };
  },
});
