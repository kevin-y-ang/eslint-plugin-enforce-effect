import { createRule } from "../utils/create-rule.js";

export default createRule({
  name: "no-or",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `||` and `||=` in favor of explicit Effect-friendly fallbacks.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noOr:
        "The user prefers Effect primitives like `Boolean.or`, `Option.orElse`, `Option.orElseSome`, `Option.firstSomeOf`, `Option.getOrElse`, `Option.getOrNull`, `Option.getOrUndefined`, `Effect.catch`, `Effect.catchCause`, `Effect.catchTag`, `Effect.catchTags`, `Effect.catchIf`, `Effect.orElseSucceed`, `Effect.matchEffect`, `Result.orElse`, or `Result.getOrElse` over vanilla `||` logical OR. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-or -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
      noOrAssign:
        "The user prefers Effect primitives like `Ref.updateSome`, `Ref.modifySome`, `Ref.getAndUpdateSome`, `SynchronizedRef.updateSome`, `SubscriptionRef.updateSome`, or `HashMap.modifyAt` over vanilla `||=` logical OR assignment. In most cases the Effect idiom is to avoid mutation entirely: compute the fallback immutably with `Boolean.or`, `Option.orElse`, `Option.orElseSome`, `Option.getOrElse`, `Effect.catch`, `Effect.orElseSucceed`, or `Result.orElse` and bind a new `const`. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-or -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      LogicalExpression(node) {
        if (node.operator !== "||") {
          return;
        }

        context.report({
          node,
          messageId: "noOr",
        });
      },
      AssignmentExpression(node) {
        if (node.operator !== "||=") {
          return;
        }

        context.report({
          node,
          messageId: "noOrAssign",
        });
      },
    };
  },
});
