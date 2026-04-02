import { createRule } from "../utils/create-rule.js";

export default createRule({
  name: "no-switch",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow `switch` statements in favor of explicit branching.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noSwitch:
        "Prefer explicit branching over JavaScript `switch` statements.",
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
