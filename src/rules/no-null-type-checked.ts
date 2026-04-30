import * as ts from "typescript";

import { createRule } from "../utils/create-rule.js";
import {
  createTypeAwareAnchorVisitors,
  mergeRuleListeners,
} from "../utils/type-aware-anchors.js";

import {
  buildNoNullMessages,
  createNoNullVisitors,
  type NoNullMessageId,
} from "./no-null.js";

const RULE_NAME = "no-null-type-checked";

type TypeCheckedMessageId = "noNullTypeChecked";
type MessageId = NoNullMessageId | TypeCheckedMessageId;

const TYPE_CHECKED_MESSAGE = `The user prefers Effect primitives like \`Option\`, \`Option.fromNullOr\`, \`Option.fromNullishOr\`, \`Schema.NullOr\`, \`Schema.NullishOr\`, \`Schema.Option\`, \`Result\`, or \`Effect\` over values whose TypeScript type contains \`null\`. Convert at the boundary with \`Option.fromNullOr\` (or \`Option.fromNullishOr\` if both \`null\` and \`undefined\` are missing sentinels). If this logic cannot be implemented with any of these primitives, use \`// eslint-disable-next-line ${RULE_NAME} -- <justification>\` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.`;

function isNullType(type: ts.Type, checker: ts.TypeChecker): boolean {
  return type === checker.getNullType();
}

export default createRule<[], MessageId>({
  name: RULE_NAME,
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow the literal `null` keyword, AND additionally flag any value whose inferred TypeScript type contains `null`. Strict superset of `no-null`.",
      recommended: false,
      requiresTypeChecking: true,
    },
    schema: [],
    messages: {
      ...buildNoNullMessages(RULE_NAME),
      noNullTypeChecked: TYPE_CHECKED_MESSAGE,
    },
  },
  defaultOptions: [],
  create(context) {
    return mergeRuleListeners(
      createNoNullVisitors<MessageId>(context),
      createTypeAwareAnchorVisitors<MessageId>(context, {
        messageId: "noNullTypeChecked",
        isBannedType: isNullType,
      }),
    );
  },
});
