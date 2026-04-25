import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "no-switch",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `switch` statements in favor of explicit branching.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noSwitch:
        "The user prefers `Match` over vanilla `switch` statements. If this logic cannot be implemented with `Match`, use `// eslint-disable-next-line no-switch -- <justification>` as a LAST RESORT. The justification MUST explain why `Match` doesn't accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      SwitchStatement(node) {
        context.report({
          node,
          messageId: "noSwitch",
        });
      },
    };
  },
});
