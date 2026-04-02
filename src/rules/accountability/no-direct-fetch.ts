import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "no-direct-fetch",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow direct fetch() usage and require an API client.",
    },
    messages: {
      noDirectFetch:
        "Do not use fetch() directly. Use the openapi-fetch client (api.GET, api.POST, etc.) instead. This provides type safety and automatic cookie handling.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        if (callee.type === "Identifier" && callee.name === "fetch") {
          context.report({
            node,
            messageId: "noDirectFetch",
          });
          return;
        }

        if (
          callee.type === "MemberExpression" &&
          callee.property.type === "Identifier" &&
          callee.property.name === "fetch" &&
          callee.object.type === "Identifier" &&
          (callee.object.name === "window" ||
            callee.object.name === "globalThis")
        ) {
          context.report({
            node,
            messageId: "noDirectFetch",
          });
        }
      },
    };
  },
});
