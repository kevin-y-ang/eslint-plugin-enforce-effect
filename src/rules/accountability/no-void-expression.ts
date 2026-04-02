import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "no-void-expression",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow void expressions because they are no-ops.",
    },
    messages: {
      noVoidExpression:
        "'void {{expression}}' is a no-op. It evaluates the expression and discards the result. Remove it or use the value.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      UnaryExpression(node) {
        if (node.operator === "void") {
          context.report({
            node,
            messageId: "noVoidExpression",
            data: { expression: context.sourceCode.getText(node.argument) },
          });
        }
      },
    };
  },
});
