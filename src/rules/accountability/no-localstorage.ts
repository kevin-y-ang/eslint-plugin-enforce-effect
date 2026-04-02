import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "no-localstorage",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow all localStorage usage.",
    },
    messages: {
      noLocalStorage:
        "Do not use localStorage. It is vulnerable to XSS attacks. Use httpOnly cookies for auth tokens, or React state/context for app state.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Identifier(node) {
        if (node.name === "localStorage") {
          if (
            node.parent.type === "MemberExpression" &&
            node.parent.property === node
          ) {
            const object = node.parent.object;
            if (
              object.type === "Identifier" &&
              (object.name === "window" || object.name === "globalThis")
            ) {
              context.report({
                node: node.parent,
                messageId: "noLocalStorage",
              });
            }
            return;
          }

          context.report({
            node,
            messageId: "noLocalStorage",
          });
        }
      },
    };
  },
});
