import { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

export default createRule({
  name: "no-explicit-function-return-type",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow explicit function return types in favor of inferred return types.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noExplicitFunctionReturnType:
        "Prefer inferred return types over explicit function return type annotations.",
    },
  },
  defaultOptions: [],
  create(context) {
    function reportIfPresent(
      node:
        | TSESTree.ArrowFunctionExpression
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression,
    ) {
      if (!node.returnType) {
        return;
      }

      context.report({
        node,
        messageId: "noExplicitFunctionReturnType",
      });
    }

    return {
      ArrowFunctionExpression: reportIfPresent,
      FunctionDeclaration: reportIfPresent,
      FunctionExpression: reportIfPresent,
    };
  },
});
