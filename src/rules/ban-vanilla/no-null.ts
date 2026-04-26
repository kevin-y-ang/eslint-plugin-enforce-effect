import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "no-null",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `null` in favor of Effect-friendly absence models.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noNull:
        "The user prefers Effect primitives like `Option`, `Option.fromNullishOr`, `Option.fromNullOr`, `Schema.NullOr`, `Schema.NullishOr`, `Schema.Option`, `Schema.UndefinedOr`, `Result`, or `Effect` over vanilla `null`. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-null -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters. See /Users/bytedance/eslint-plugin-enforce-effect/docs/rules/no-null.md",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      Literal(node) {
        if (node.value !== null) {
          return;
        }

        context.report({
          node,
          messageId: "noNull",
        });
      },
      TSNullKeyword(node) {
        context.report({
          node,
          messageId: "noNull",
        });
      },
    };
  },
});
