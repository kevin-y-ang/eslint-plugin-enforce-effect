import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

function isJsonStringifyCall(node: TSESTree.CallExpression): boolean {
  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }

  const { object, property, computed } = node.callee;

  if (object.type !== AST_NODE_TYPES.Identifier || object.name !== "JSON") {
    return false;
  }

  if (
    !computed &&
    property.type === AST_NODE_TYPES.Identifier &&
    property.name === "stringify"
  ) {
    return true;
  }

  if (
    computed &&
    property.type === AST_NODE_TYPES.Literal &&
    property.value === "stringify"
  ) {
    return true;
  }

  return false;
}

export default createRule({
  name: "no-json-stringify",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `JSON.stringify` in favor of validated encoding via `Schema`.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noJsonStringify:
        "The user prefers Effect primitives like `Schema.encode`, `Schema.encodeSync`, `Schema.encodeUnknown`, `Schema.encodeUnknownSync`, `Schema.encodeOption`, `Schema.encodeEither`, `Schema.toJsonString`, or `Schema.encodeToJsonString` over vanilla `JSON.stringify(...)` calls. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-json-stringify -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (!isJsonStringifyCall(node)) {
          return;
        }

        context.report({
          node,
          messageId: "noJsonStringify",
        });
      },
    };
  },
});
