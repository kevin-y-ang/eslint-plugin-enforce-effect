import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "no-throw",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `throw` in favor of Effect-based failure channels.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noThrow:
        "The user prefers `Effect.fail` over vanilla `throw` statements. If this logic cannot be implemented with `Effect.fail`, use `// eslint-disable-next-line no-throw -- <justification>` as a LAST RESORT. The justification MUST explain why `Effect.fail` doesn't accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ThrowStatement(node) {
        context.report({
          node,
          messageId: "noThrow",
        });
      },
    };
  },
});
