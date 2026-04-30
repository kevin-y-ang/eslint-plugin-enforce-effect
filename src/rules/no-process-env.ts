import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

function isProcessEnvAccess(node: TSESTree.MemberExpression): boolean {
  if (
    node.object.type !== AST_NODE_TYPES.Identifier ||
    node.object.name !== "process"
  ) {
    return false;
  }

  if (
    !node.computed &&
    node.property.type === AST_NODE_TYPES.Identifier &&
    node.property.name === "env"
  ) {
    return true;
  }

  if (
    node.computed &&
    node.property.type === AST_NODE_TYPES.Literal &&
    node.property.value === "env"
  ) {
    return true;
  }

  return false;
}

export default createRule({
  name: "no-process-env",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `process.env` access in favor of explicit configuration.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noProcessEnv:
        "The user prefers Effect primitives like `Config.string`, `Config.int`, `Config.boolean`, `Config.redacted`, `Config.url`, `Config.port`, `Config.duration`, `Config.literal`, `Config.schema`, `Config.nested`, `Config.withDefault`, `ConfigProvider.fromEnv`, `ConfigProvider.fromDotEnv`, `ConfigProvider.fromUnknown`, or `ConfigProvider.layer` over vanilla `process.env` access. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-process-env -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      MemberExpression(node) {
        if (!isProcessEnvAccess(node)) {
          return;
        }

        context.report({
          node,
          messageId: "noProcessEnv",
        });
      },
    };
  },
});
