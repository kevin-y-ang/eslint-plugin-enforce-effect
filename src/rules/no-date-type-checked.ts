import * as ts from "typescript";

import { createRule } from "../utils/create-rule.js";
import {
  createTypeAwareAnchorVisitors,
  isDeclaredInTsLib,
  mergeRuleListeners,
} from "../utils/type-aware-anchors.js";

import {
  buildNoDateMessages,
  createNoDateVisitors,
  type NoDateMessageId,
} from "./no-date.js";

const RULE_NAME = "no-date-type-checked";

type TypeCheckedMessageId = "noDateTypeChecked";
type MessageId = NoDateMessageId | TypeCheckedMessageId;

const TYPE_CHECKED_MESSAGE = `The user prefers Effect primitives like \`DateTime.DateTime\`, \`DateTime.Utc\`, or \`DateTime.Zoned\` over values whose TypeScript type is the vanilla \`Date\`. Convert at the boundary with \`DateTime.fromDateUnsafe\` or \`DateTime.make\`. If this logic cannot be implemented with any of these primitives, use \`// eslint-disable-next-line ${RULE_NAME} -- <justification>\` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.`;

function isGlobalDateType(type: ts.Type): boolean {
  const symbol = type.getSymbol() ?? type.aliasSymbol;

  if (!symbol || symbol.getName() !== "Date") {
    return false;
  }

  return isDeclaredInTsLib(symbol);
}

export default createRule<[], MessageId>({
  name: RULE_NAME,
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `Date` constructor calls, `Date.now()` calls, and `Date` type references, AND additionally flag any value whose inferred TypeScript type is `Date`. Strict superset of `no-date`.",
      recommended: false,
      requiresTypeChecking: true,
    },
    schema: [],
    messages: {
      ...buildNoDateMessages(RULE_NAME),
      noDateTypeChecked: TYPE_CHECKED_MESSAGE,
    },
  },
  defaultOptions: [],
  create(context) {
    return mergeRuleListeners(
      createNoDateVisitors<MessageId>(context),
      createTypeAwareAnchorVisitors<MessageId>(context, {
        messageId: "noDateTypeChecked",
        isBannedType: isGlobalDateType,
      }),
    );
  },
});
