import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "no-effect-ignore",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow Effect.ignore because it silently discards errors.",
    },
    messages: {
      noEffectIgnore:
        "Do not use Effect.ignore. It silently discards errors which hides bugs. Handle errors explicitly with Effect.catchTag, Effect.catchAll, or propagate them.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      MemberExpression(node) {
        if (
          node.object.type === "Identifier" &&
          node.object.name === "Effect" &&
          node.property.type === "Identifier" &&
          node.property.name === "ignore"
        ) {
          context.report({
            node,
            messageId: "noEffectIgnore",
          });
        }
      },
    };
  },
});
