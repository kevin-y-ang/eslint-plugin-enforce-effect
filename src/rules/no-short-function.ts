import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

type FunctionLike =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression;

type Options = [
  {
    minBodyLines?: number;
    minReferences?: number;
    allowBracelessArrowFunctions?: boolean;
  },
];

type MessageIds = "noShortFunction";

const DEFAULT_MIN_BODY_LINES = 3;
const DEFAULT_MIN_REFERENCES = 2;
const DEFAULT_ALLOW_BRACELESS_ARROW_FUNCTIONS = false;

function bodyLineCount(fn: FunctionLike): number {
  const body = fn.body;
  if (body.type !== "BlockStatement") {
    // Concise arrow expression body — semantically a single expression with
    // no braces, so we treat it as zero lines "between the brackets".
    return 0;
  }
  // Empty single-line bodies (e.g. `() => {}`) end up with `end - start - 1
  // === -1`; clamp to 0 so callers can compare against thresholds without
  // worrying about negative counts.
  return Math.max(0, body.loc.end.line - body.loc.start.line - 1);
}

function isInside(node: TSESTree.Node, ancestor: TSESTree.Node): boolean {
  return (
    node.range[0] >= ancestor.range[0] && node.range[1] <= ancestor.range[1]
  );
}

function isExportedDeclaration(
  node: TSESTree.FunctionDeclaration | TSESTree.VariableDeclarator,
): boolean {
  const parent = node.parent;
  if (!parent) {
    return false;
  }
  if (
    parent.type === "ExportNamedDeclaration" ||
    parent.type === "ExportDefaultDeclaration"
  ) {
    return true;
  }
  if (parent.type === "VariableDeclaration") {
    return parent.parent?.type === "ExportNamedDeclaration";
  }
  return false;
}

export default createRule<Options, MessageIds>({
  name: "no-short-function",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow short, rarely-referenced named functions in favor of inlining them at the call site.",
      recommended: false,
      requiresTypeChecking: false,
    },
    schema: [
      {
        type: "object",
        description: "Options for `no-short-function`.",
        properties: {
          minBodyLines: {
            type: "integer",
            description:
              "Minimum number of lines between the function body's braces required for a function to escape this rule. Functions with strictly fewer body lines are flagged. Concise arrow expression bodies (e.g. `(x) => x * 2`) always count as zero lines.",
            minimum: 1,
          },
          minReferences: {
            type: "integer",
            description:
              "Minimum number of references (outside the function's own body) required for a function to escape this rule. Functions with strictly fewer references are flagged. The default of 2 matches the original 'used exactly one other time in the file' spec.",
            minimum: 1,
          },
          allowBracelessArrowFunctions: {
            type: "boolean",
            description:
              "When true, arrow functions with a concise (braceless) expression body — e.g. `(x) => x * 2` — are skipped by this rule entirely. Defaults to false, meaning braceless arrows are subject to the same minBodyLines / minReferences thresholds as block-bodied functions.",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noShortFunction:
        "`{{name}}` is short and used in too few places in this file to justify a named function. Inline it at the call site instead of defining a separate function.",
    },
    defaultOptions: [{}],
  },
  defaultOptions: [{}],
  create(context) {
    const options = context.options[0] ?? {};
    const minBodyLines = options.minBodyLines ?? DEFAULT_MIN_BODY_LINES;
    const minReferences = options.minReferences ?? DEFAULT_MIN_REFERENCES;
    const allowBracelessArrowFunctions =
      options.allowBracelessArrowFunctions ??
      DEFAULT_ALLOW_BRACELESS_ARROW_FUNCTIONS;
    const sourceCode = context.sourceCode;

    function check(
      name: string,
      declarationNode:
        | TSESTree.FunctionDeclaration
        | TSESTree.VariableDeclarator,
      reportNode: TSESTree.Node,
      fnNode: FunctionLike,
    ): void {
      if (
        allowBracelessArrowFunctions &&
        fnNode.type === "ArrowFunctionExpression" &&
        fnNode.body.type !== "BlockStatement"
      ) {
        return;
      }
      if (bodyLineCount(fnNode) >= minBodyLines) {
        return;
      }
      if (isExportedDeclaration(declarationNode)) {
        return;
      }

      const variables = sourceCode.getDeclaredVariables(declarationNode);
      const variable = variables.find((v) => v.name === name);
      if (!variable) {
        return;
      }

      const reassignments = variable.references.filter(
        (ref) => ref.isWrite() && !ref.init,
      );
      if (reassignments.length > 0) {
        return;
      }

      const reads = variable.references.filter((ref) => ref.isRead());

      // Skip recursive / self-referential functions: those references are not
      // independently inlinable, and counting them would muddle the "used in
      // too few other places" intent of the rule.
      const hasSelfReference = reads.some((ref) =>
        isInside(ref.identifier, fnNode),
      );
      if (hasSelfReference) {
        return;
      }

      // Skip if any reference re-exports the binding (`export { foo }`,
      // `export default foo`, `export = foo`). Re-exports are part of the
      // file's public surface, so the function isn't truly local.
      const isReExported = reads.some((ref) => {
        const refParentType = ref.identifier.parent?.type;
        return (
          refParentType === "ExportSpecifier" ||
          refParentType === "ExportDefaultDeclaration" ||
          refParentType === "TSExportAssignment"
        );
      });
      if (isReExported) {
        return;
      }

      if (reads.length === 0 || reads.length >= minReferences) {
        return;
      }

      context.report({
        node: reportNode,
        messageId: "noShortFunction",
        data: { name },
      });
    }

    return {
      FunctionDeclaration(node) {
        if (!node.id) {
          return;
        }
        check(node.id.name, node, node.id, node);
      },
      VariableDeclarator(node) {
        if (node.id.type !== "Identifier") {
          return;
        }
        if (!node.init) {
          return;
        }
        if (
          node.init.type !== "ArrowFunctionExpression" &&
          node.init.type !== "FunctionExpression"
        ) {
          return;
        }
        check(node.id.name, node, node.id, node.init);
      },
    };
  },
});
