import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "no-direct-fetch",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow fetch() in favor of FetchHttpClient from effect.",
    },
    messages: {
      noDirectFetch:
        "The user prefers Effect primitives like `HttpClient`, `HttpClientRequest`, `HttpClientResponse`, `FetchHttpClient`, `NodeHttpClient.layerUndici`, `NodeHttpClient.layerNodeHttp`, `BrowserHttpClient.layerXMLHttpRequest`, or `HttpApiClient` over vanilla `fetch()`. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-direct-fetch -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters. See /Users/bytedance/eslint-plugin-enforce-effect/docs/rules/no-direct-fetch.md",
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
