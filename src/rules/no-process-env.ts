import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

function isProcessEnvAccess(node: TSESTree.MemberExpression): boolean {
  if (
    node.object.type !== AST_NODE_TYPES.Identifier ||
    node.object.name !== "process"
  ) {
    return false;
  }

  if (
    !node.computed &&
    node.property.type === AST_NODE_TYPES.Identifier &&
    node.property.name === "env"
  ) {
    return true;
  }

  if (
    node.computed &&
    node.property.type === AST_NODE_TYPES.Literal &&
    node.property.value === "env"
  ) {
    return true;
  }

  return false;
}

export default createRule({
  name: "no-process-env",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow `process.env` access in favor of explicit configuration.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noProcessEnv:
        "Prefer explicit configuration services over direct `process.env` access.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      MemberExpression(node) {
        if (!isProcessEnvAccess(node)) {
          return;
        }

        context.report({
          node,
          messageId: "noProcessEnv",
        });
      },
    };
  },
});
