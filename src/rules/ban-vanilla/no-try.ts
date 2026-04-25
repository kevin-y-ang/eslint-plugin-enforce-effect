import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "no-try",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `try` blocks in favor of Effect-based error handling.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noTry:
        "The user prefers `Effect.try` and `Effect.tryPromise` over vanilla `try` blocks. If this logic cannot be implemented with `Effect.try` or `Effect.tryPromise`, use `// eslint-disable-next-line no-try -- <justification>` as a LAST RESORT. The justification MUST explain why `Effect.try` doesn't accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      TryStatement(node) {
        context.report({
          node,
          messageId: "noTry",
        });
      },
    };
  },
});
