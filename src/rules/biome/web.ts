/* eslint-disable no-unused-vars */
import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";
import {
  isEffectFile,
  isNamespacedCall,
  isPipeCall,
  subtreeHas,
  textIncludesAny,
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

export const biomeWebRules = {
  "no-atom-registry-effect-sync": createEffectOnlyRule(
    "no-atom-registry-effect-sync",
    "Disallow Atom and atomRegistry operations wrapped in Effect.sync.",
    "noAtomRegistryEffectSync",
    "Rule: do not wrap Atom/atomRegistry ops in Effect.sync. Why: it hides side effects and breaks atom flow. Fix: call Atom.get/Atom.set/Atom.update/Atom.modify/Atom.refresh directly.",
    (context) => ({
      CallExpression(node) {
        if (!isNamespacedCall(node, "Effect", "sync")) {
          return;
        }

        const firstArgument = node.arguments[0];
        if (!firstArgument || firstArgument.type === AST_NODE_TYPES.SpreadElement) {
          return;
        }

        const text = context.sourceCode.getText(firstArgument);
        if (
          /(atomRegistry|Atom)\.(get|set|update|modify|refresh)\(/.test(text)
        ) {
          context.report({
            node,
            messageId: "noAtomRegistryEffectSync",
          });
        }
      },
    }),
  ),
  "no-inline-runtime-provide": createEffectOnlyRule(
    "no-inline-runtime-provide",
    "Disallow inline Effect.provide in yielded runtime pipes.",
    "noInlineRuntimeProvide",
    "Rule: do not inline runtime provisioning inside local helper Effect code. Why: inline provide chains hide dependency assembly. Fix: declare the live dependency on the owning service or provide it once at the exported boundary.",
    (context) => ({
      YieldExpression(node) {
        if (!node.delegate || !node.argument || node.argument.type !== AST_NODE_TYPES.CallExpression) {
          return;
        }

        if (!isPipeCall(node.argument)) {
          return;
        }

        let inlineProvide: TSESTree.CallExpression | null = null;
        subtreeHas(node.argument, (candidate) => {
          if (
            candidate.type === AST_NODE_TYPES.CallExpression &&
            isNamespacedCall(candidate, "Effect", "provide") &&
            candidate.arguments.length === 1
          ) {
            inlineProvide = candidate;
            return true;
          }

          return false;
        });

        if (inlineProvide) {
          context.report({
            node: inlineProvide,
            messageId: "noInlineRuntimeProvide",
          });
        }
      },
    }),
  ),
  "no-react-state": createRule({
    name: "no-react-state",
    meta: {
      type: "problem",
      docs: {
        description: "Disallow React state hooks.",
        recommended: false,
        requiresTypeChecking: false,
      },
      schema: [],
      messages: {
        noReactState:
          "Rule: avoid React state hooks. Why: they bypass the atom runtime and break reactive flow. Fix: use @effect-atom/atom-react instead of useState/useReducer/useContext/useEffect/useCallback/useSyncExternalStore.",
      },
    },
    defaultOptions: [],
    create(context) {
      const hookNames = new Set([
        "useState",
        "useReducer",
        "useContext",
        "useCallback",
        "useEffect",
        "useSyncExternalStore",
      ]);

      return {
        CallExpression(node) {
          if (
            (node.callee.type === AST_NODE_TYPES.Identifier &&
              hookNames.has(node.callee.name)) ||
            (node.callee.type === AST_NODE_TYPES.MemberExpression &&
              node.callee.property.type === AST_NODE_TYPES.Identifier &&
              hookNames.has(node.callee.property.name))
          ) {
            context.report({
              node,
              messageId: "noReactState",
            });
          }
        },
      };
    },
  }),
  "no-render-side-effects": createEffectOnlyRule(
    "no-render-side-effects",
    "Disallow Match.value(...).pipe(...) statements that run side effects during render.",
    "noRenderSideEffects",
    "Rule: avoid Match.value(...).pipe(...) as a statement. Why: it runs side effects during render. Fix: move the side effect into an Effect runtime action or event handler, and keep Match as a pure expression.",
    (context) => ({
      ExpressionStatement(node) {
        if (node.expression.type !== AST_NODE_TYPES.CallExpression) {
          return;
        }

        if (!isPipeCall(node.expression)) {
          return;
        }

        const text = context.sourceCode.getText(node.expression);
        if (
          text.includes("Match.value(") &&
          textIncludesAny(text, [
            "Match.when(",
            "Match.orElse(",
            "=> Effect.",
            "=> void ",
          ])
        ) {
          context.report({
            node,
            messageId: "noRenderSideEffects",
          });
        }
      },
    }),
  ),
  "no-wrapgraphql-catchall": createEffectOnlyRule(
    "no-wrapgraphql-catchall",
    "Disallow Effect.catchAll after wrapGraphqlCall/applyResponse flows.",
    "noWrapGraphqlCatchAll",
    "Rule: avoid catchAll after wrapGraphqlCall/applyResponse. Why: the envelope already surfaces structured errors. Fix: handle errors in the response mapping instead of catchAll.",
    (context) => ({
      CallExpression(node) {
        if (!isPipeCall(node)) {
          return;
        }

        const text = context.sourceCode.getText(node);
        if (
          text.includes("Effect.catchAll(") &&
          (text.includes("wrapGraphqlCall(") ||
            text.includes("Effect.flatMap(applyResponse)"))
        ) {
          context.report({
            node,
            messageId: "noWrapGraphqlCatchAll",
          });
        }
      },
    }),
  ),
};
