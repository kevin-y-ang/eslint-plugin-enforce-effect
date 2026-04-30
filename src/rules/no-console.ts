import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

function isConsoleRoot(node: TSESTree.Expression): boolean {
  if (node.type === AST_NODE_TYPES.Identifier && node.name === "console") {
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
    node.property.name === "console"
  ) {
    return true;
  }

  if (
    node.computed &&
    node.property.type === AST_NODE_TYPES.Literal &&
    node.property.value === "console"
  ) {
    return true;
  }

  return false;
}

export default createRule({
  name: "no-console",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `console.*` in favor of Effect's structured `Logger`.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noConsole:
        "The user prefers Effect primitives like `Console.log`, `Effect.log`, `Effect.logTrace`, `Effect.logDebug`, `Effect.logInfo`, `Effect.logWarning`, `Effect.logError`, `Effect.logFatal`, `Effect.withLogSpan`, `Effect.annotateLogs`, `Effect.withMinimumLogLevel`, `Logger.make`, `Logger.replace`, or `Logger.withConsoleLog` over vanilla `console.log` / `console.error` / `console.warn` / etc. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-console -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      MemberExpression(node) {
        if (!isConsoleRoot(node.object)) {
          return;
        }

        context.report({
          node,
          messageId: "noConsole",
        });
      },
    };
  },
});
