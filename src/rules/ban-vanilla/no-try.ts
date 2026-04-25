import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "no-try",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `try` blocks in favor of Effect-based error handling.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noTry:
        "The user prefers Effect primitives like `Effect.try` / `Effect.tryPromise` (to lift sync/async exceptions into the `Effect` model), `Effect.catch` / `Effect.catchTag` / `Effect.catchTags` / `Effect.catchCause` (for recovery), and `Effect.ensuring` / `Effect.onExit` / `Effect.scoped` with `Effect.acquireRelease` (for `finally`-style cleanup) over vanilla `try` / `catch` / `finally` blocks. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-try -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      TryStatement(node) {
        context.report({
          node,
          messageId: "noTry",
        });
      },
    };
  },
});
