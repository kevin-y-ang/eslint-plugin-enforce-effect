import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";

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
        "The user prefers `Schema.fromJsonString` over vanilla `JSON.parse(...)` calls. If this logic cannot be implemented with `Schema.fromJsonString`, use `// eslint-disable-next-line no-json-parse -- <justification>` as a LAST RESORT. The justification MUST explain why `Schema.fromJsonString` doesn't accomplish your goal, and MUST be no less than 40 characters.",
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
