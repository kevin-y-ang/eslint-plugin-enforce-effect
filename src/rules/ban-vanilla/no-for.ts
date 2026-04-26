import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "no-for",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `for` loops in favor of explicit iteration helpers.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noFor:
        "The user prefers Effect primitives like `Effect.forEach`, `Array.map`, `Array.reduce`, `Iterable.map`, `Record.collect`, `Record.toEntries`, `HashMap.forEach`, `Effect.all`, `Effect.whileLoop`, `Effect.forever`, `Effect.repeat`, `Stream.fromIterable` + `Stream.runForEach`, or `Stream.fromIterable` + `Stream.mapEffect` over vanilla `for` / `for...of` / `for...in` loops. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-for -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters. See /Users/bytedance/eslint-plugin-enforce-effect/docs/rules/no-for.md",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ForStatement(node) {
        context.report({
          node,
          messageId: "noFor",
        });
      },
      ForInStatement(node) {
        context.report({
          node,
          messageId: "noFor",
        });
      },
      ForOfStatement(node) {
        context.report({
          node,
          messageId: "noFor",
        });
      },
    };
  },
});
