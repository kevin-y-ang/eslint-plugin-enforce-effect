import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

const BANNED_TIMER_NAMES = new Set([
  "setTimeout",
  "setInterval",
  "clearTimeout",
  "clearInterval",
  "queueMicrotask",
  "setImmediate",
  "clearImmediate",
]);

function isGlobalRoot(node: TSESTree.Expression): boolean {
  return (
    node.type === AST_NODE_TYPES.Identifier &&
    (node.name === "globalThis" ||
      node.name === "window" ||
      node.name === "self")
  );
}

function getMemberPropertyName(
  node: TSESTree.MemberExpression,
): string | null {
  if (
    !node.computed &&
    node.property.type === AST_NODE_TYPES.Identifier
  ) {
    return node.property.name;
  }

  if (
    node.computed &&
    node.property.type === AST_NODE_TYPES.Literal &&
    typeof node.property.value === "string"
  ) {
    return node.property.value;
  }

  return null;
}

export default createRule({
  name: "no-timers",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `setTimeout`, `setInterval`, `queueMicrotask`, and related timer globals in favor of Effect-based scheduling.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noTimers:
        "The user prefers Effect primitives like `Effect.sleep`, `Effect.delay`, `Effect.repeat`, `Effect.schedule`, `Effect.fork`, `Effect.forkScoped`, `Effect.forkDaemon`, `Schedule.spaced`, `Schedule.fixed`, `Schedule.exponential`, `Schedule.recurs`, `Fiber.interrupt`, or `Effect.race` over vanilla `setTimeout` / `setInterval` / `queueMicrotask` / `setImmediate`. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-timers -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    function reportIfBanned(callee: TSESTree.Node) {
      if (
        callee.type === AST_NODE_TYPES.Identifier &&
        BANNED_TIMER_NAMES.has(callee.name)
      ) {
        context.report({
          node: callee,
          messageId: "noTimers",
        });
        return;
      }

      if (callee.type === AST_NODE_TYPES.MemberExpression) {
        if (!isGlobalRoot(callee.object)) {
          return;
        }

        const propertyName = getMemberPropertyName(callee);

        if (propertyName !== null && BANNED_TIMER_NAMES.has(propertyName)) {
          context.report({
            node: callee,
            messageId: "noTimers",
          });
        }
      }
    }

    return {
      CallExpression(node) {
        reportIfBanned(node.callee);
      },
    };
  },
});
