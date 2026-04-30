import {
  AST_NODE_TYPES,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

function isNonComputedPropertyName(node: TSESTree.Identifier): boolean {
  const parent = node.parent;

  if (!parent) {
    return false;
  }

  if (
    parent.type === AST_NODE_TYPES.MemberExpression &&
    parent.property === node &&
    !parent.computed
  ) {
    return true;
  }

  if (
    parent.type === AST_NODE_TYPES.Property &&
    parent.key === node &&
    !parent.computed
  ) {
    return true;
  }

  if (
    parent.type === AST_NODE_TYPES.MethodDefinition &&
    parent.key === node &&
    !parent.computed
  ) {
    return true;
  }

  if (
    parent.type === AST_NODE_TYPES.PropertyDefinition &&
    parent.key === node &&
    !parent.computed
  ) {
    return true;
  }

  return false;
}

export type NoUndefinedMessageId = "noUndefined";

export function buildNoUndefinedMessages(
  ruleName: string,
): Record<NoUndefinedMessageId, string> {
  return {
    noUndefined: `The user prefers Effect primitives like \`Option\`, \`Option.fromNullishOr\`, \`Option.fromUndefinedOr\`, \`Schema.UndefinedOr\`, \`Schema.NullishOr\`, \`Schema.Option\`, \`Schema.NullOr\`, \`Result\`, or \`Effect\` over vanilla \`undefined\`. If this logic cannot be implemented with any of these primitives, use \`// eslint-disable-next-line ${ruleName} -- <justification>\` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.`,
  };
}

export function createNoUndefinedVisitors<MessageId extends string>(
  context: TSESLint.RuleContext<MessageId, []>,
): TSESLint.RuleListener {
  const report = (
    node: TSESTree.Node,
    messageId: NoUndefinedMessageId,
  ): void => {
    context.report({ node, messageId: messageId as MessageId });
  };

  return {
    Identifier(node) {
      if (node.name !== "undefined") {
        return;
      }

      if (isNonComputedPropertyName(node)) {
        return;
      }

      report(node, "noUndefined");
    },
    TSUndefinedKeyword(node) {
      report(node, "noUndefined");
    },
  };
}

export default createRule<[], NoUndefinedMessageId>({
  name: "no-undefined",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `undefined` in favor of explicit Effect-friendly models.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: buildNoUndefinedMessages("no-undefined"),
  },
  defaultOptions: [],
  create(context) {
    return createNoUndefinedVisitors(context);
  },
});
