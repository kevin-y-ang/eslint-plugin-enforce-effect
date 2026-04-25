import { createRule } from "../../utils/create-rule.js";

export default createRule({
  name: "no-sql-type-parameter",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow type parameters on sql template literals.",
    },
    messages: {
      noSqlTypeParam:
        "Do not use sql<Type>` as a LAST RESORT...`. Type parameters provide no runtime validation. Use SqlSchema.findOne/findAll/single/void with a Schema for type-safe queries that validate at runtime.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      TaggedTemplateExpression(node) {
        const tag = node.tag;
        const typeArguments = (
          node as typeof node & { typeArguments?: unknown }
        ).typeArguments;

        if (typeArguments) {
          const isSql =
            (tag.type === "Identifier" && tag.name === "sql") ||
            (tag.type === "MemberExpression" &&
              tag.property.type === "Identifier" &&
              tag.property.name === "sql");

          if (isSql) {
            context.report({
              node,
              messageId: "noSqlTypeParam",
            });
          }
        }
      },
    };
  },
});
