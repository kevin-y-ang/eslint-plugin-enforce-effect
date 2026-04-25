import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";

const PROMISE_STATIC_METHODS = new Set([
  "all",
  "allSettled",
  "any",
  "race",
  "reject",
  "resolve",
  "try",
  "withResolvers",
]);

const PROMISE_CHAIN_MESSAGE_IDS = {
  then: "noPromiseChainThen",
  catch: "noPromiseChainCatch",
} as const;

type PromiseChainMethod = keyof typeof PROMISE_CHAIN_MESSAGE_IDS;

function isPromiseChainMethod(name: string): name is PromiseChainMethod {
  return name === "then" || name === "catch";
}

export default createRule({
  name: "no-promise",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow direct Promise APIs in favor of Effect-based abstractions.",
      recommended: true,
      requiresTypeChecking: false,
    },
    schema: [],
    messages: {
      noAsync:
        "The user prefers Effect primitives like `Effect.gen` (generator/coroutine style), `Effect.fn` / `Effect.fnUntraced` (named, traced Effect-returning functions), `Effect.suspend` (lazy/recursive bodies), or `Effect.callback` (callback-resume APIs) over vanilla `async` functions. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-promise -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
      noAwait:
        "The user prefers Effect primitives like `yield*` inside `Effect.gen` (the direct `await` analogue), `Effect.flatMap` (sequential bind), `Effect.andThen` (flexible sequencing), or `Effect.fromYieldable` (bridging other yieldable values) over vanilla `await`. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-promise -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
      noPromiseConstructor:
        "The user prefers Effect primitives like `Effect.promise` / `Effect.tryPromise` (wrapping Promise-returning APIs), `Effect.callback` (callback-style completion with optional cleanup), or `Deferred.make` (when you need an externally-resolved primitive) over vanilla `new Promise(...)`. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-promise -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
      noPromiseChainThen:
        "The user prefers Effect primitives like `Effect.flatMap` (monadic chain), `Effect.andThen` (flexible sequencing), `Effect.map` (pure transform of success), or `Effect.tap` (side effects without changing the value) over vanilla `.then(...)` promise chaining. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-promise -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
      noPromiseChainCatch:
        "The user prefers Effect primitives like `Effect.catch` (handle all recoverable errors), `Effect.catchTag` / `Effect.catchTags` (tagged-error handling), `Effect.catchCause` (recover from the full `Cause`, including defects), or `Effect.mapError` (reshape the error channel) over vanilla `.catch(...)` promise chaining. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-promise -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
      noPromiseStatic:
        "The user prefers Effect primitives like `Effect.all` (with `mode: \"result\"` for `allSettled`-style behavior) and `Effect.partition` for `Promise.all` / `Promise.allSettled`, `Effect.race` / `Effect.raceFirst` / `Effect.raceAll` for `Promise.race` / `Promise.any`, `Effect.succeed` / `Effect.fail` for `Promise.resolve` / `Promise.reject`, `Effect.try` for `Promise.try`, and `Deferred.make` for `Promise.withResolvers`, over vanilla `Promise.{{ method }}(...)`. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-promise -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ArrowFunctionExpression(node) {
        if (!node.async) {
          return;
        }

        context.report({
          node,
          messageId: "noAsync",
        });
      },
      AwaitExpression(node) {
        context.report({
          node,
          messageId: "noAwait",
        });
      },
      CallExpression(node) {
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
          return;
        }

        const { object, property, computed } = node.callee;

        if (
          !computed &&
          property.type === AST_NODE_TYPES.Identifier &&
          object.type === AST_NODE_TYPES.Identifier &&
          object.name === "Promise" &&
          PROMISE_STATIC_METHODS.has(property.name)
        ) {
          context.report({
            node,
            messageId: "noPromiseStatic",
            data: {
              method: property.name,
            },
          });
        }

        if (
          !computed &&
          property.type === AST_NODE_TYPES.Identifier &&
          isPromiseChainMethod(property.name)
        ) {
          context.report({
            node,
            messageId: PROMISE_CHAIN_MESSAGE_IDS[property.name],
          });
        }

        if (
          computed &&
          property.type === AST_NODE_TYPES.Literal &&
          typeof property.value === "string" &&
          isPromiseChainMethod(property.value)
        ) {
          context.report({
            node,
            messageId: PROMISE_CHAIN_MESSAGE_IDS[property.value],
          });
        }
      },
      FunctionDeclaration(node) {
        if (!node.async) {
          return;
        }

        context.report({
          node,
          messageId: "noAsync",
        });
      },
      FunctionExpression(node) {
        if (!node.async) {
          return;
        }

        context.report({
          node,
          messageId: "noAsync",
        });
      },
      NewExpression(node) {
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === "Promise"
        ) {
          context.report({
            node,
            messageId: "noPromiseConstructor",
          });
        }
      },
    };
  },
});
