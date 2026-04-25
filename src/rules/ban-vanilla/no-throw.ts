import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "no-throw",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `throw` in favor of Effect-based failure channels.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noThrow:
        "The user prefers Effect primitives like `Effect.fail` (typed, recoverable error on the `E` channel), `Effect.failSync` (lazy error value), `Effect.failCause` (full `Cause<E>` with structured failure), or `Effect.die` (unrecoverable defect for invariants/bugs) over vanilla `throw` statements. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-throw -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ThrowStatement(node) {
        context.report({
          node,
          messageId: "noThrow",
        });
      },
    };
  },
});
