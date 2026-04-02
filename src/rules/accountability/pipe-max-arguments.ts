import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "pipe-max-arguments",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow .pipe() with more than 20 arguments.",
    },
    messages: {
      tooManyArgs:
        ".pipe() has {{count}} arguments. Consider splitting into multiple .pipe() calls for readability (max 20).",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        if (
          callee.type === "MemberExpression" &&
          callee.property.type === "Identifier" &&
          callee.property.name === "pipe" &&
          node.arguments.length > 20
        ) {
          context.report({
            node,
            messageId: "tooManyArgs",
            data: { count: node.arguments.length },
          });
        }
      },
    };
  },
});
