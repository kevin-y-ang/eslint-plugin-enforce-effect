import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";

function isNonComputedPropertyName(node: TSESTree.Identifier): boolean {
  const parent = node.parent;

  if (!parent) {
    return false;
  }

  if (
    parent.type === AST_NODE_TYPES.MemberExpression &&
    parent.property === node &&
    !parent.computed
  ) {
    return true;
  }

  if (
    parent.type === AST_NODE_TYPES.Property &&
    parent.key === node &&
    !parent.computed
  ) {
    return true;
  }

  if (
    parent.type === AST_NODE_TYPES.MethodDefinition &&
    parent.key === node &&
    !parent.computed
  ) {
    return true;
  }

  if (
    parent.type === AST_NODE_TYPES.PropertyDefinition &&
    parent.key === node &&
    !parent.computed
  ) {
    return true;
  }

  return false;
}

export default createRule({
  name: "no-undefined",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `undefined` in favor of explicit Effect-friendly models.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noUndefined:
        "The user prefers `Option` over vanilla `undefined`. If this logic cannot be implemented with `Option`, use `// eslint-disable-next-line no-undefined -- <justification>` as a LAST RESORT. The justification MUST explain why `Option` doesn't accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      Identifier(node) {
        if (node.name !== "undefined") {
          return;
        }

        if (isNonComputedPropertyName(node)) {
          return;
        }

        context.report({
          node,
          messageId: "noUndefined",
        });
      },
      TSUndefinedKeyword(node) {
        context.report({
          node,
          messageId: "noUndefined",
        });
      },
    };
  },
});
