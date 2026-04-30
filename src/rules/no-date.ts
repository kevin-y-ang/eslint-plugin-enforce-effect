import {
  AST_NODE_TYPES,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";

function isDateIdentifier(node: unknown): boolean {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    "name" in node &&
    (node as { type: string }).type === AST_NODE_TYPES.Identifier &&
    (node as { name: string }).name === "Date"
  );
}

function isDateNowMemberExpression(node: TSESTree.Node): boolean {
  if (node.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }

  if (!isDateIdentifier(node.object)) {
    return false;
  }

  const { property, computed } = node;

  if (
    !computed &&
    property.type === AST_NODE_TYPES.Identifier &&
    property.name === "now"
  ) {
    return true;
  }

  if (
    computed &&
    property.type === AST_NODE_TYPES.Literal &&
    property.value === "now"
  ) {
    return true;
  }

  return false;
}

export type NoDateMessageId = "noDateConstructor" | "noDateNow" | "noDateType";

export function buildNoDateMessages(
  ruleName: string,
): Record<NoDateMessageId, string> {
  return {
    noDateConstructor: `The user prefers Effect primitives like \`DateTime.now\`, \`DateTime.nowUnsafe\`, \`DateTime.nowInCurrentZone\`, \`DateTime.make\`, \`DateTime.makeUnsafe\`, \`DateTime.fromDateUnsafe\`, \`DateTime.makeZonedFromString\`, \`Clock.currentTimeMillis\`, or \`Clock.currentTimeNanos\` over vanilla \`new Date(...)\` construction. If this logic cannot be implemented with any of these primitives, use \`// eslint-disable-next-line ${ruleName} -- <justification>\` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.`,
    noDateNow: `The user prefers Effect primitives like \`Clock.currentTimeMillis\`, \`Clock.currentTimeNanos\`, \`DateTime.now\`, or \`DateTime.nowUnsafe\` over vanilla \`Date.now()\`. The \`Clock\` service makes "now" testable via dependency injection (swap \`TestClock\` in tests). If this logic cannot be implemented with any of these primitives, use \`// eslint-disable-next-line ${ruleName} -- <justification>\` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.`,
    noDateType: `The user prefers Effect primitives like \`DateTime.DateTime\`, \`DateTime.Utc\`, or \`DateTime.Zoned\` over vanilla \`Date\` type references. If this logic cannot be implemented with any of these primitives, use \`// eslint-disable-next-line ${ruleName} -- <justification>\` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.`,
  };
}

export function createNoDateVisitors<MessageId extends string>(
  context: TSESLint.RuleContext<MessageId, []>,
): TSESLint.RuleListener {
  // The compiler cannot express that `NoDateMessageId` is assignable to
  // `MessageId` (the variance goes the wrong way), so we cast the literal
  // message ids to `MessageId` at the report site.
  const report = (
    node: TSESTree.Node,
    messageId: NoDateMessageId,
  ): void => {
    context.report({ node, messageId: messageId as MessageId });
  };

  return {
    CallExpression(node) {
      if (isDateNowMemberExpression(node.callee)) {
        report(node, "noDateNow");
        return;
      }

      if (isDateIdentifier(node.callee)) {
        report(node, "noDateConstructor");
      }
    },
    NewExpression(node) {
      if (!isDateIdentifier(node.callee)) {
        return;
      }

      report(node, "noDateConstructor");
    },
    TSTypeReference(node) {
      if (!isDateIdentifier(node.typeName)) {
        return;
      }

      report(node, "noDateType");
    },
  };
}

export default createRule<[], NoDateMessageId>({
  name: "no-date",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `Date` constructor calls, `Date.now()` calls, and `Date` type references in favor of Effect-based date and clock primitives.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: buildNoDateMessages("no-date"),
  },
  defaultOptions: [],
  create(context) {
    return createNoDateVisitors(context);
  },
});
