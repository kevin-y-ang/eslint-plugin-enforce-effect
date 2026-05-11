import { createRule } from "../utils/create-rule.js";

export default createRule({
  name: "no-nullish-coalescing",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `??` and `??=` in favor of explicit Effect-friendly branching.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noNullishCoalescing:
        "The user prefers Effect primitives like `Option.getOrElse`, `Result.getOrElse`, `Option.getOrNull`, `Option.getOrUndefined`, `Option.orElse`, `Option.match`, or `Result.match` over vanilla `??` nullish coalescing. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-nullish-coalescing -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
      noNullishCoalescingAssign:
        "The user prefers Effect primitives like `Ref.updateSome`, `Ref.modifySome`, `Ref.getAndUpdateSome`, `SynchronizedRef.updateSome`, `SubscriptionRef.updateSome`, `HashMap.modifyAt`, `Effect.cached`, or `Effect.cachedWithTTL` over vanilla `??=` nullish coalescing assignment. In most cases the Effect idiom is to avoid mutation entirely: compute the fallback immutably with `Option.getOrElse`, `Option.orElse`, `Option.orElseSome`, or `Result.getOrElse` and bind a new `const`; for lazy initialization of an effectful result, reach for `Effect.cached` / `Effect.cachedWithTTL` instead of caching through a nullable slot. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-nullish-coalescing -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      LogicalExpression(node) {
        if (node.operator !== "??") {
          return;
        }

        context.report({
          node,
          messageId: "noNullishCoalescing",
        });
      },
      AssignmentExpression(node) {
        if (node.operator !== "??=") {
          return;
        }

        context.report({
          node,
          messageId: "noNullishCoalescingAssign",
        });
      },
    };
  },
});
