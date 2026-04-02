import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

function isJsonParseCall(node: TSESTree.CallExpression): boolean {
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
    property.name === "parse"
  ) {
    return true;
  }

  if (
    computed &&
    property.type === AST_NODE_TYPES.Literal &&
    property.value === "parse"
  ) {
    return true;
  }

  return false;
}

export default createRule({
  name: "no-json-parse",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow `JSON.parse` in favor of validated decoding.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noJsonParse:
        "Prefer validated decoding over direct `JSON.parse(...)` calls.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (!isJsonParseCall(node)) {
          return;
        }

        context.report({
          node,
          messageId: "noJsonParse",
        });
      },
    };
  },
});
