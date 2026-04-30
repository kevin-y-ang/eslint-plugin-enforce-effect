import { createRule } from "../utils/create-rule.js";

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
        "The user prefers Effect primitives like `Record.get`, `HashMap.get`, `Array.get`, `Option.gen`, `Option.flatMap`, `Option.flatMapNullishOr`, `Option.map`, `Option.filterMap`, `Option.fromNullishOr`, `Option.liftNullishOr`, `Option.getOrElse`, or `Option.match` over vanilla `?.` optional chaining. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-optional-chaining -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
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
