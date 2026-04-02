import { createRule } from "../../utils/create-rule.js";

function isLayerProvide(node: any): boolean {
  return (
    node &&
    node.type === "CallExpression" &&
    node.callee.type === "MemberExpression" &&
    node.callee.object.type === "Identifier" &&
    node.callee.object.name === "Layer" &&
    node.callee.property.type === "Identifier" &&
    node.callee.property.name === "provide"
  );
}

export default createRule({
  name: "no-nested-layer-provide",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow nested Layer.provide calls.",
    },
    messages: {
      nestedProvide:
        "Nested Layer.provide detected. Extract the inner Layer.provide to a separate variable or use Layer.provideMerge.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (!isLayerProvide(node)) {
          return;
        }

        for (const argument of node.arguments) {
          if (isLayerProvide(argument)) {
            context.report({
              node: argument,
              messageId: "nestedProvide",
            });
          }
        }
      },
    };
  },
});
