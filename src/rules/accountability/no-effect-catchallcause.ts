import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "no-effect-catchallcause",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow Effect.catchAllCause because it catches defects that should not be caught.",
    },
    messages: {
      noEffectCatchAllCause:
        "Do not use Effect.catchAllCause. It catches defects (bugs) which should crash the program. Use Effect.catchAll or Effect.catchTag to handle expected errors only.",
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
          node.property.name === "catchAllCause"
        ) {
          context.report({
            node,
            messageId: "noEffectCatchAllCause",
          });
        }
      },
    };
  },
});
