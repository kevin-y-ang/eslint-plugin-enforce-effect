import { createRule } from "../utils/create-rule.js";

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
        "The user prefers Effect primitives like `Match.tags`, `Match.tagsExhaustive`, `Match.typeTags`, `Match.valueTags`, `Match.discriminator`, `Match.discriminators`, `Match.value`, `Match.type`, `Match.when`, `Match.exhaustive`, `Match.orElse`, `Option.match`, `Result.match`, `Exit.match`, `Effect.match`, `Effect.matchEffect`, or `Effect.matchCause` over vanilla `switch` statements. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-switch -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
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
