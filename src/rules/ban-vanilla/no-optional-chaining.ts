import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "no-optional-chaining",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow optional chaining in favor of explicit branching.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noOptionalChaining:
        "The user prefers `Option.flatMap` over vanilla `?.` optional chaining. If this logic cannot be implemented with `Option.flatMap`, use `// eslint-disable-next-line no-optional-chaining -- <justification>` as a LAST RESORT. The justification MUST explain why `Option.flatMap` doesn't accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ChainExpression(node) {
        context.report({
          node,
          messageId: "noOptionalChaining",
        });
      },
    };
  },
});
