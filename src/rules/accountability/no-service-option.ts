import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "no-service-option",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow Effect.serviceOption because services should always be present in context.",
    },
    messages: {
      noServiceOption:
        "Do not use Effect.serviceOption. Services should always be present in context, even during testing. Yield the service directly (yield* MyService) and ensure it is provided in your layer composition.",
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
          callee.object.type === "Identifier" &&
          callee.object.name === "Effect" &&
          callee.property.type === "Identifier" &&
          callee.property.name === "serviceOption"
        ) {
          context.report({
            node,
            messageId: "noServiceOption",
          });
        }
      },
    };
  },
});
