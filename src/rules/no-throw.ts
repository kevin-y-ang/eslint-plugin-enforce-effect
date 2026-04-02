import { createRule } from "../utils/create-rule.js";

export default createRule({
  name: "no-throw",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow `throw` in favor of Effect-based failure channels.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noThrow:
        "Prefer Effect failure primitives over JavaScript `throw` statements.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ThrowStatement(node) {
        context.report({
          node,
          messageId: "noThrow",
        });
      },
    };
  },
});
