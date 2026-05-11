import { createRule } from "../utils/create-rule.js";

export default createRule({
  name: "no-and",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `&&` and `&&=` in favor of explicit Effect-friendly sequencing and guards.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noAnd:
        "The user prefers Effect primitives like `Boolean.and`, `Option.flatMap`, `Option.andThen`, `Option.zipRight`, `Option.filter`, `Effect.flatMap`, `Effect.andThen`, `Effect.when`, `Effect.filterOrFail`, `Effect.filterOrElse`, `Result.flatMap`, `Result.andThen`, or `Result.filterOrFail` over vanilla `&&` logical AND. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-and -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
      noAndAssign:
        "The user prefers Effect primitives like `Ref.updateSome`, `Ref.modifySome`, `Ref.getAndUpdateSome`, `SynchronizedRef.updateSome`, or `SubscriptionRef.updateSome` over vanilla `&&=` logical AND assignment. In most cases the Effect idiom is to avoid mutation entirely: compute the new value immutably with `Boolean.and`, `Option.flatMap`, `Option.filter`, `Effect.when`, `Effect.filterOrFail`, `Effect.filterOrElse`, or `Result.filterOrFail` and bind a new `const`. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-and -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      LogicalExpression(node) {
        if (node.operator !== "&&") {
          return;
        }

        context.report({
          node,
          messageId: "noAnd",
        });
      },
      AssignmentExpression(node) {
        if (node.operator !== "&&=") {
          return;
        }

        context.report({
          node,
          messageId: "noAndAssign",
        });
      },
    };
  },
});
