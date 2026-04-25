import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "no-for",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `for` loops in favor of explicit iteration helpers.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noFor:
        "The user prefers `Effect.forEach` over vanilla `for` loops. If this logic cannot be implemented with `Effect.forEach`, use `// eslint-disable-next-line no-for -- <justification>` as a LAST RESORT. The justification MUST explain why `Effect.forEach` doesn't accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ForStatement(node) {
        context.report({
          node,
          messageId: "noFor",
        });
      },
      ForInStatement(node) {
        context.report({
          node,
          messageId: "noFor",
        });
      },
      ForOfStatement(node) {
        context.report({
          node,
          messageId: "noFor",
        });
      },
    };
  },
});
