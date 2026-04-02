import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "prefer-option-from-nullable",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer Option.fromNullable over ternary with Option.some/none.",
    },
    messages: {
      preferFromNullable:
        "Use Option.fromNullable({{name}}) instead of ternary with Option.some/Option.none.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ConditionalExpression(node) {
        const { test, consequent, alternate } = node;

        if (test.type !== "BinaryExpression") {
          return;
        }

        if (test.operator !== "!==" && test.operator !== "!=") {
          return;
        }

        let testedName: string | null = null;
        if (
          test.left.type === "Identifier" &&
          test.right.type === "Literal" &&
          test.right.value === null
        ) {
          testedName = test.left.name;
        } else if (
          test.right.type === "Identifier" &&
          test.left.type === "Literal" &&
          test.left.value === null
        ) {
          testedName = test.right.name;
        } else if (
          test.left.type === "MemberExpression" &&
          test.right.type === "Literal" &&
          test.right.value === null
        ) {
          testedName = context.sourceCode.getText(test.left);
        } else if (
          test.right.type === "MemberExpression" &&
          test.left.type === "Literal" &&
          test.left.value === null
        ) {
          testedName = context.sourceCode.getText(test.right);
        }

        if (!testedName || consequent.type !== "CallExpression") {
          return;
        }

        const consequentCallee = consequent.callee;
        const isOptionSome =
          consequentCallee.type === "MemberExpression" &&
          consequentCallee.object.type === "Identifier" &&
          consequentCallee.object.name === "Option" &&
          consequentCallee.property.type === "Identifier" &&
          consequentCallee.property.name === "some";

        if (!isOptionSome || alternate.type !== "CallExpression") {
          return;
        }

        const alternateCallee = alternate.callee;
        const isOptionNone =
          (alternateCallee.type === "MemberExpression" &&
            alternateCallee.object.type === "Identifier" &&
            alternateCallee.object.name === "Option" &&
            alternateCallee.property.type === "Identifier" &&
            alternateCallee.property.name === "none") ||
          (alternateCallee.type === "TSInstantiationExpression" &&
            alternateCallee.expression.type === "MemberExpression" &&
            alternateCallee.expression.object.type === "Identifier" &&
            alternateCallee.expression.object.name === "Option" &&
            alternateCallee.expression.property.type === "Identifier" &&
            alternateCallee.expression.property.name === "none");

        if (!isOptionNone) {
          return;
        }

        context.report({
          node,
          messageId: "preferFromNullable",
          data: { name: testedName },
        });
      },
    };
  },
});
