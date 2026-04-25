import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";

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
        "The user prefers Effect primitives like `Data.TaggedError`, `Data.Error`, `Schema.TaggedErrorClass`, `Schema.ErrorClass`, or `Cause.UnknownError` over vanilla `Error(...)` construction. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-error -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
      noErrorType:
        "The user prefers Effect primitives like `Data.TaggedError`, `Data.Error`, `Schema.TaggedErrorClass`, `Schema.ErrorClass`, or `Cause.YieldableError` over vanilla `Error` type references. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-error -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
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
