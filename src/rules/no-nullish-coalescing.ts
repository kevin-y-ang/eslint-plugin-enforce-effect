import { createRule } from "../utils/create-rule.js";

export default createRule({
  name: "no-nullish-coalescing",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `??` in favor of explicit Effect-friendly branching.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noNullishCoalescing:
        "The user prefers Effect primitives like `Option.getOrElse`, `Result.getOrElse`, `Option.getOrNull`, `Option.getOrUndefined`, `Option.orElse`, `Option.match`, or `Result.match` over vanilla `??` nullish coalescing. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-nullish-coalescing -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      LogicalExpression(node) {
        if (node.operator !== "??") {
          return;
        }

        context.report({
          node,
          messageId: "noNullishCoalescing",
        });
      },
    };
  },
});
