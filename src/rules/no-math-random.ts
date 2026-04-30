import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

function isMathRandomMemberExpression(
  node: TSESTree.MemberExpression,
): boolean {
  if (
    node.object.type !== AST_NODE_TYPES.Identifier ||
    node.object.name !== "Math"
  ) {
    return false;
  }

  if (
    !node.computed &&
    node.property.type === AST_NODE_TYPES.Identifier &&
    node.property.name === "random"
  ) {
    return true;
  }

  if (
    node.computed &&
    node.property.type === AST_NODE_TYPES.Literal &&
    node.property.value === "random"
  ) {
    return true;
  }

  return false;
}

export default createRule({
  name: "no-math-random",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `Math.random()` in favor of Effect's `Random` service.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noMathRandom:
        "The user prefers Effect primitives like `Random.next`, `Random.nextInt`, `Random.nextIntBetween`, `Random.nextRange`, `Random.nextBoolean`, `Random.choice`, `Random.shuffle`, `Random.Random`, `Random.make`, or `Random.withSeed` over vanilla `Math.random()`. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-math-random -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      MemberExpression(node) {
        if (!isMathRandomMemberExpression(node)) {
          return;
        }

        context.report({
          node,
          messageId: "noMathRandom",
        });
      },
    };
  },
});
