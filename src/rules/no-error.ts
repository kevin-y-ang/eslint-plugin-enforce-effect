import {
  AST_NODE_TYPES,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

function isErrorIdentifier(node: unknown): boolean {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    "name" in node &&
    (node as { type: string }).type === AST_NODE_TYPES.Identifier &&
    (node as { name: string }).name === "Error"
  );
}

export type NoErrorMessageId = "noErrorConstructor" | "noErrorType";

export function buildNoErrorMessages(
  ruleName: string,
): Record<NoErrorMessageId, string> {
  return {
    noErrorConstructor: `The user prefers Effect primitives like \`Data.TaggedError\`, \`Schema.TaggedErrorClass\`, \`Data.Error\`, \`Schema.ErrorClass\`, \`Cause.NoSuchElementError\`, \`Cause.TimeoutError\`, \`Cause.IllegalArgumentError\`, \`Cause.ExceededCapacityError\`, or \`Cause.UnknownError\` over vanilla \`Error(...)\` construction. If this logic cannot be implemented with any of these primitives, use \`// eslint-disable-next-line ${ruleName} -- <justification>\` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.`,
    noErrorType: `The user prefers Effect primitives like \`Data.TaggedError\`, \`Schema.TaggedErrorClass\`, \`Data.Error\`, \`Schema.ErrorClass\`, \`Cause.NoSuchElementError\`, \`Cause.TimeoutError\`, \`Cause.IllegalArgumentError\`, \`Cause.ExceededCapacityError\`, or \`Cause.YieldableError\` over vanilla \`Error\` type references. If this logic cannot be implemented with any of these primitives, use \`// eslint-disable-next-line ${ruleName} -- <justification>\` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.`,
  };
}

export function createNoErrorVisitors<MessageId extends string>(
  context: TSESLint.RuleContext<MessageId, []>,
): TSESLint.RuleListener {
  const report = (
    node: TSESTree.Node,
    messageId: NoErrorMessageId,
  ): void => {
    context.report({ node, messageId: messageId as MessageId });
  };

  return {
    CallExpression(node) {
      if (!isErrorIdentifier(node.callee)) {
        return;
      }

      report(node, "noErrorConstructor");
    },
    NewExpression(node) {
      if (!isErrorIdentifier(node.callee)) {
        return;
      }

      report(node, "noErrorConstructor");
    },
    TSTypeReference(node) {
      if (!isErrorIdentifier(node.typeName)) {
        return;
      }

      report(node, "noErrorType");
    },
  };
}

export default createRule<[], NoErrorMessageId>({
  name: "no-error",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `Error` constructor calls and `Error` type references.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: buildNoErrorMessages("no-error"),
  },
  defaultOptions: [],
  create(context) {
    return createNoErrorVisitors(context);
  },
});
