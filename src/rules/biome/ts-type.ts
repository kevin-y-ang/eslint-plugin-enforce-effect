/* eslint-disable no-unused-vars */
import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";
import {
  isEffectFile,
  isNamespacedCall,
  isNullLiteral,
  isStringLiteral,
  objectPropertyByName,
} from "./helpers.js";

type BiomeRuleContext = Parameters<Parameters<typeof createRule>[0]["create"]>[0];
type BiomeRuleVisitors = Record<string, (...args: [any]) => void>;

function createEffectOnlyRule(
  name: string,
  description: string,
  messageId: string,
  message: string,
  createVisitors: (context: BiomeRuleContext) => BiomeRuleVisitors,
) {
  return createRule({
    name,
    meta: {
      type: "problem",
      docs: {
        description,
        recommended: false,
        requiresTypeChecking: false,
      },
      schema: [],
      messages: {
        [messageId]: message,
      },
    },
    defaultOptions: [],
    create(context) {
      if (!isEffectFile(context.sourceCode.text)) {
        return {};
      }

      return createVisitors(context);
    },
  });
}

export const biomeTsTypeRules = {
  "no-effect-type-alias": createEffectOnlyRule(
    "no-effect-type-alias",
    "Disallow Effect.Effect type aliases.",
    "noEffectTypeAlias",
    "Rule: avoid Effect.Effect type aliases. Why: they hide the service surface and make types opaque. Fix: keep Effect types on service methods or inline at the call site.",
    (context) => ({
      TSTypeAliasDeclaration(node) {
        if (context.sourceCode.getText(node.typeAnnotation).includes("Effect.Effect")) {
          context.report({
            node,
            messageId: "noEffectTypeAlias",
          });
        }
      },
    }),
  ),
  "no-fromnullable-nullish-coalesce": createEffectOnlyRule(
    "no-fromnullable-nullish-coalesce",
    "Disallow nullish re-wraps inside Option.fromNullable.",
    "noFromNullableNullishCoalesce",
    "Rule: avoid nullish re-wrap inside Option.fromNullable. Why: `x ?? null` and `x ?? undefined` add noise and hide source shape. Fix: pass the source directly to Option.fromNullable.",
    (context) => ({
      CallExpression(node) {
        if (!isNamespacedCall(node, "Option", "fromNullable")) {
          return;
        }

        const firstArgument = node.arguments[0];
        if (
          !firstArgument ||
          firstArgument.type === AST_NODE_TYPES.SpreadElement ||
          firstArgument.type !== AST_NODE_TYPES.LogicalExpression ||
          firstArgument.operator !== "??"
        ) {
          return;
        }

        if (
          isNullLiteral(firstArgument.right) ||
          firstArgument.right.type === AST_NODE_TYPES.Identifier
        ) {
          context.report({
            node,
            messageId: "noFromNullableNullishCoalesce",
          });
        }
      },
    }),
  ),
  "no-model-overlay-cast": createEffectOnlyRule(
    "no-model-overlay-cast",
    "Disallow model overlay casts using `as` in const assignments.",
    "noModelOverlayCast",
    "Rule: avoid `as` assertions on decoded model flow. Why: assertions hide schema drift and allow untyped overlays. Fix: decode with the correct schema type and read fields directly.",
    (context) => ({
      VariableDeclarator(node) {
        if (
          node.parent?.type === AST_NODE_TYPES.VariableDeclaration &&
          node.parent.kind === "const" &&
          node.init?.type === AST_NODE_TYPES.TSAsExpression &&
          context.sourceCode.getText(node.init.typeAnnotation) !== "const"
        ) {
          context.report({
            node,
            messageId: "noModelOverlayCast",
          });
        }
      },
    }),
  ),
  "no-option-boolean-normalization": createEffectOnlyRule(
    "no-option-boolean-normalization",
    "Disallow Option.match normalization from optional booleans to boolean defaults.",
    "noOptionBooleanNormalization",
    "Rule: avoid repeated Option boolean normalization (`onSome: value === true, onNone: false`). Why: it scatters coercion rules across services. Fix: normalize once at schema boundary and read booleans directly.",
    (context) => ({
      CallExpression(node) {
        if (!isNamespacedCall(node, "Option", "match")) {
          return;
        }

        const secondArgument = node.arguments[1];
        if (
          !secondArgument ||
          secondArgument.type === AST_NODE_TYPES.SpreadElement ||
          secondArgument.type !== AST_NODE_TYPES.ObjectExpression
        ) {
          return;
        }

        const onSome = objectPropertyByName(secondArgument, "onSome");
        const onNone = objectPropertyByName(secondArgument, "onNone");

        if (!onSome || !onNone) {
          return;
        }

        const onSomeText = context.sourceCode.getText(onSome.value);
        const onNoneText = context.sourceCode.getText(onNone.value);

        if (onSomeText.includes("=== true") && onNoneText.includes("=> false")) {
          context.report({
            node,
            messageId: "noOptionBooleanNormalization",
          });
        }
      },
    }),
  ),
  "no-unknown-boolean-coercion-helper": createEffectOnlyRule(
    "no-unknown-boolean-coercion-helper",
    "Disallow local unknown-to-boolean coercion helpers in Effect services.",
    "noUnknownBooleanCoercionHelper",
    "Rule: avoid local unknown-to-boolean coercion helpers in services. Why: runtime coercion belongs at schema boundary, not in service flow. Fix: decode boolean optionality in schema and read typed booleans in the Effect pipeline.",
    (context) => ({
      BinaryExpression(node) {
        if (
          node.left.type === AST_NODE_TYPES.UnaryExpression &&
          node.left.operator === "typeof" &&
          isStringLiteral(node.right, "boolean") &&
          context.sourceCode.text.includes("Match.orElse(() => null)")
        ) {
          context.report({
            node,
            messageId: "noUnknownBooleanCoercionHelper",
          });
        }
      },
    }),
  ),
};
