import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

const BANNED_MODULE_NAMES = new Set([
  "fs",
  "fs/promises",
  "node:fs",
  "node:fs/promises",
]);

function isBannedModuleName(value: string): boolean {
  return BANNED_MODULE_NAMES.has(value);
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
  name: "no-fs",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `fs` / `node:fs` imports in favor of Effect's `FileSystem` service.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noFs:
        "The user prefers Effect primitives like `FileSystem.FileSystem` (with `readFileString`, `writeFileString`, `stream`, `sink`, `open`, `stat`, `readDirectory`, `makeDirectory`, `remove`, `watch`, etc.), `NodeFileSystem.layer`, `NodeServices.layer`, `BunFileSystem.layer`, `Path.Path`, or `NodePath.layer` over vanilla `fs` / `node:fs` / `fs/promises`. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-fs -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
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
        messageId: "noFs",
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
