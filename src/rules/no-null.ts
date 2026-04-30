import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

export type NoNullMessageId = "noNull";

export function buildNoNullMessages(
  ruleName: string,
): Record<NoNullMessageId, string> {
  return {
    noNull: `The user prefers Effect primitives like \`Option\`, \`Option.fromNullishOr\`, \`Option.fromNullOr\`, \`Schema.NullOr\`, \`Schema.NullishOr\`, \`Schema.Option\`, \`Schema.UndefinedOr\`, \`Result\`, or \`Effect\` over vanilla \`null\`. If this logic cannot be implemented with any of these primitives, use \`// eslint-disable-next-line ${ruleName} -- <justification>\` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.`,
  };
}

export function createNoNullVisitors<MessageId extends string>(
  context: TSESLint.RuleContext<MessageId, []>,
): TSESLint.RuleListener {
  const report = (node: TSESTree.Node, messageId: NoNullMessageId): void => {
    context.report({ node, messageId: messageId as MessageId });
  };

  return {
    Literal(node) {
      if (node.value !== null) {
        return;
      }

      report(node, "noNull");
    },
    TSNullKeyword(node) {
      report(node, "noNull");
    },
  };
}

export default createRule<[], NoNullMessageId>({
  name: "no-null",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `null` in favor of Effect-friendly absence models.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: buildNoNullMessages("no-null"),
  },
  defaultOptions: [],
  create(context) {
    return createNoNullVisitors(context);
  },
});
