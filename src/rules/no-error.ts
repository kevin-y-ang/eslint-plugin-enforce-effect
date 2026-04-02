import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

function isErrorIdentifier(node: unknown): boolean {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    "name" in node &&
    (node as { type: string }).type === AST_NODE_TYPES.Identifier &&
    (node as { name: string }).name === "Error"
  );
}

export default createRule({
  name: "no-error",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `Error` constructor calls and `Error` type references.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noErrorConstructor:
        "Prefer domain-specific failures over direct `Error(...)` construction.",
      noErrorType:
        "Prefer domain-specific error types over the built-in `Error` type.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (!isErrorIdentifier(node.callee)) {
          return;
        }

        context.report({
          node,
          messageId: "noErrorConstructor",
        });
      },
      NewExpression(node) {
        if (!isErrorIdentifier(node.callee)) {
          return;
        }

        context.report({
          node,
          messageId: "noErrorConstructor",
        });
      },
      TSTypeReference(node) {
        if (!isErrorIdentifier(node.typeName)) {
          return;
        }

        context.report({
          node,
          messageId: "noErrorType",
        });
      },
    };
  },
});
