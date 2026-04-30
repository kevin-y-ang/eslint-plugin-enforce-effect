import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

function isPerformanceRoot(node: TSESTree.Expression): boolean {
  if (
    node.type === AST_NODE_TYPES.Identifier &&
    node.name === "performance"
  ) {
    return true;
  }

  if (node.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }

  if (
    node.object.type !== AST_NODE_TYPES.Identifier ||
    (node.object.name !== "globalThis" &&
      node.object.name !== "window" &&
      node.object.name !== "self")
  ) {
    return false;
  }

  if (
    !node.computed &&
    node.property.type === AST_NODE_TYPES.Identifier &&
    node.property.name === "performance"
  ) {
    return true;
  }

  if (
    node.computed &&
    node.property.type === AST_NODE_TYPES.Literal &&
    node.property.value === "performance"
  ) {
    return true;
  }

  return false;
}

function isNowProperty(node: TSESTree.MemberExpression): boolean {
  if (
    !node.computed &&
    node.property.type === AST_NODE_TYPES.Identifier &&
    node.property.name === "now"
  ) {
    return true;
  }

  if (
    node.computed &&
    node.property.type === AST_NODE_TYPES.Literal &&
    node.property.value === "now"
  ) {
    return true;
  }

  return false;
}

export default createRule({
  name: "no-performance-now",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `performance.now()` in favor of Effect's `Clock` service.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noPerformanceNow:
        "The user prefers Effect primitives like `Clock.currentTimeMillis`, `Clock.currentTimeNanos`, `Clock.Clock` (with `currentTimeMillisUnsafe()` / `currentTimeNanosUnsafe()` for sync access), `Effect.timed`, or `Effect.timedWith` over vanilla `performance.now()` calls. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-performance-now -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      MemberExpression(node) {
        if (!isPerformanceRoot(node.object)) {
          return;
        }

        if (!isNowProperty(node)) {
          return;
        }

        context.report({
          node,
          messageId: "noPerformanceNow",
        });
      },
    };
  },
});
