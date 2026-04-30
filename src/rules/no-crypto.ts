import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

const BANNED_MODULE_NAMES = new Set([
  "crypto",
  "node:crypto",
  "node:webcrypto",
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

function isCryptoRoot(node: TSESTree.Expression): boolean {
  if (node.type === AST_NODE_TYPES.Identifier && node.name === "crypto") {
    return true;
  }

  if (node.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }

  if (
    node.object.type !== AST_NODE_TYPES.Identifier ||
    (node.object.name !== "globalThis" &&
      node.object.name !== "window" &&
      node.object.name !== "self")
  ) {
    return false;
  }

  if (
    !node.computed &&
    node.property.type === AST_NODE_TYPES.Identifier &&
    node.property.name === "crypto"
  ) {
    return true;
  }

  if (
    node.computed &&
    node.property.type === AST_NODE_TYPES.Literal &&
    node.property.value === "crypto"
  ) {
    return true;
  }

  return false;
}

export default createRule({
  name: "no-crypto",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `crypto` module imports and ad hoc `globalThis.crypto` access in favor of platform `Crypto` capability modules.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noCrypto:
        "The user prefers Effect primitives like `Crypto.Crypto`, `Crypto.randomBytes`, `Crypto.randomUUID`, `Crypto.getRandomValues`, `Crypto.hash`, `Crypto.subtle`, `NodeCrypto.layer`, `BrowserCrypto.layer`, `Random.next`, or `Random.nextBytes` over vanilla `crypto` / `node:crypto` imports and `globalThis.crypto` / `window.crypto` access. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-crypto -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    function reportImportIfBanned(
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
        messageId: "noCrypto",
      });
    }

    return {
      CallExpression(node) {
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === "require"
        ) {
          const [firstArgument] = node.arguments;

          if (
            !firstArgument ||
            firstArgument.type === AST_NODE_TYPES.SpreadElement
          ) {
            return;
          }

          reportImportIfBanned(firstArgument, node);
        }
      },
      ExportAllDeclaration(node) {
        reportImportIfBanned(node.source, node);
      },
      ExportNamedDeclaration(node) {
        reportImportIfBanned(node.source, node);
      },
      ImportDeclaration(node) {
        reportImportIfBanned(node.source, node);
      },
      ImportExpression(node) {
        reportImportIfBanned(node.source, node);
      },
      MemberExpression(node) {
        if (!isCryptoRoot(node.object)) {
          return;
        }

        context.report({
          node,
          messageId: "noCrypto",
        });
      },
      TSImportEqualsDeclaration(node) {
        if (
          node.moduleReference.type !== AST_NODE_TYPES.TSExternalModuleReference
        ) {
          return;
        }

        reportImportIfBanned(node.moduleReference.expression, node);
      },
    };
  },
});
