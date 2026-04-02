import { createRule } from "../utils/create-rule.js";

export default createRule({
  name: "no-null",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow `null` in favor of Effect-friendly absence models.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noNull:
        "Prefer explicit Effect-friendly absence models over JavaScript `null`.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      Literal(node) {
        if (node.value !== null) {
          return;
        }

        context.report({
          node,
          messageId: "noNull",
        });
      },
      TSNullKeyword(node) {
        context.report({
          node,
          messageId: "noNull",
        });
      },
    };
  },
});
