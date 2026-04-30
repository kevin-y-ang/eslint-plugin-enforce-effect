import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

function isBannedModuleName(value: string): boolean {
  return value === "child_process" || value === "node:child_process";
}

function getStaticStringValue(
  node: TSESTree.Expression | TSESTree.StringLiteral,
): string | null {
  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === "string") {
    return node.value;
  }

  return null;
}

export default createRule({
  name: "no-node-child-process",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `child_process` imports in favor of safer runtime boundaries.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noNodeChildProcess:
        "The user prefers Effect primitives like `ChildProcessSpawner`, `NodeChildProcessSpawner.layer`, `NodeServices.layer`, `ChildProcess.make`, `ChildProcess.pipeTo`, `NodeWorker`, or `Worker.layerSpawner` over vanilla `child_process` / `worker_threads`. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-node-child-process -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    function reportIfBanned(
      source: TSESTree.Expression | TSESTree.StringLiteral | null | undefined,
      node: TSESTree.Node,
    ) {
      if (!source) {
        return;
      }

      const value = getStaticStringValue(source);

      if (!value || !isBannedModuleName(value)) {
        return;
      }

      context.report({
        node,
        messageId: "noNodeChildProcess",
      });
    }

    return {
      CallExpression(node) {
        if (
          node.callee.type !== AST_NODE_TYPES.Identifier ||
          node.callee.name !== "require"
        ) {
          return;
        }

        const [firstArgument] = node.arguments;

        if (
          !firstArgument ||
          firstArgument.type === AST_NODE_TYPES.SpreadElement
        ) {
          return;
        }

        reportIfBanned(firstArgument, node);
      },
      ExportAllDeclaration(node) {
        reportIfBanned(node.source, node);
      },
      ExportNamedDeclaration(node) {
        reportIfBanned(node.source, node);
      },
      ImportDeclaration(node) {
        reportIfBanned(node.source, node);
      },
      ImportExpression(node) {
        reportIfBanned(node.source, node);
      },
      TSImportEqualsDeclaration(node) {
        if (
          node.moduleReference.type !== AST_NODE_TYPES.TSExternalModuleReference
        ) {
          return;
        }

        reportIfBanned(node.moduleReference.expression, node);
      },
    };
  },
});
