import * as ts from "typescript";

import { createRule } from "../utils/create-rule.js";
import {
  createTypeAwareAnchorVisitors,
  mergeRuleListeners,
} from "../utils/type-aware-anchors.js";

import {
  buildNoUndefinedMessages,
  createNoUndefinedVisitors,
  type NoUndefinedMessageId,
} from "./no-undefined.js";

const RULE_NAME = "no-undefined-type-checked";

type TypeCheckedMessageId = "noUndefinedTypeChecked";
type MessageId = NoUndefinedMessageId | TypeCheckedMessageId;

const TYPE_CHECKED_MESSAGE = `The user prefers Effect primitives like \`Option\`, \`Option.fromUndefinedOr\`, \`Option.fromNullishOr\`, \`Schema.UndefinedOr\`, \`Schema.NullishOr\`, \`Schema.Option\`, \`Result\`, or \`Effect\` over values whose TypeScript type contains \`undefined\`. Convert at the boundary with \`Option.fromUndefinedOr\` (or \`Option.fromNullishOr\` if both \`null\` and \`undefined\` are missing sentinels). If this logic cannot be implemented with any of these primitives, use \`// eslint-disable-next-line ${RULE_NAME} -- <justification>\` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.`;

function isUndefinedType(type: ts.Type, checker: ts.TypeChecker): boolean {
  return type === checker.getUndefinedType();
}

export default createRule<[], MessageId>({
  name: RULE_NAME,
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow the literal `undefined` keyword, AND additionally flag any value whose inferred TypeScript type contains `undefined`. Does not flag `void` function returns. Strict superset of `no-undefined`.",
      recommended: false,
      requiresTypeChecking: true,
    },
    schema: [],
    messages: {
      ...buildNoUndefinedMessages(RULE_NAME),
      noUndefinedTypeChecked: TYPE_CHECKED_MESSAGE,
    },
  },
  defaultOptions: [],
  create(context) {
    return mergeRuleListeners(
      createNoUndefinedVisitors<MessageId>(context),
      createTypeAwareAnchorVisitors<MessageId>(context, {
        messageId: "noUndefinedTypeChecked",
        isBannedType: isUndefinedType,
      }),
    );
  },
});
