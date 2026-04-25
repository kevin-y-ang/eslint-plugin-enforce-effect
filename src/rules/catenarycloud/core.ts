import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";
import {
  isEffectCall,
  isEffectFile,
  isInlineFunction,
  isNamespacedCall,
  isNamespacedMember,
  isNullLiteral,
  isPipeCall,
  isStringLiteral,
  subtreeHas,
  textIncludesAny,
} from "./helpers.js";

type catenarycloudRuleContext = Parameters<
  Parameters<typeof createRule>[0]["create"]
>[0];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type catenarycloudRuleVisitors = Record<string, (...args: [any]) => void>;

const EFFECT_SEQUENCE_METHODS = [
  "flatMap",
  "map",
  "andThen",
  "tap",
  "zipRight",
];

function createEffectOnlyRule(
  name: string,
  description: string,
  messageId: string,
  message: string,
  createVisitors: (
    context: catenarycloudRuleContext,
  ) => catenarycloudRuleVisitors,
  type: "problem" | "suggestion" = "problem",
) {
  return createRule({
    name,
    meta: {
      type,
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

const SIDE_EFFECT_FRAGMENTS = [
  "setState(",
  "Atom.set(",
  "invalidate(",
  "Effect.log",
  "console.",
];

const SEQUENCE_SIDE_EFFECT_FRAGMENTS = [
  "Ref.set(",
  "Atom.set(",
  "SubscriptionRef.set(",
  "Reactivity.invalidate(",
  "Fiber.interrupt(",
  "Effect.log",
];

function blockContainsReturn(
  body: TSESTree.BlockStatement | TSESTree.Expression,
): boolean {
  if (body.type !== AST_NODE_TYPES.BlockStatement) {
    return false;
  }

  return subtreeHas(
    body,
    (candidate) => candidate.type === AST_NODE_TYPES.ReturnStatement,
  );
}

function branchContainsSequencing(
  context: catenarycloudRuleContext,
  node: TSESTree.Node,
): boolean {
  const text = context.sourceCode.getText(node);
  return (
    textIncludesAny(
      text,
      EFFECT_SEQUENCE_METHODS.map((name) => `Effect.${name}(`),
    ) ||
    text.includes("pipe(") ||
    text.includes(".pipe(") ||
    text.includes("Stream.")
  );
}

export const catenarycloudCoreRules = {
  "no-arrow-ladder": createEffectOnlyRule(
    "no-arrow-ladder",
    "Disallow nested immediately-invoked arrow wrappers.",
    "noArrowLadder",
    "Rule: avoid nested IIFEs. Why: they hide sequencing and push wrapper hacks. Fix: bind a named context with const and keep one flat pipeline with a single Match/Option decision.",
    (context) => ({
      CallExpression(node) {
        if (!isInlineFunction(node.callee)) {
          return;
        }

        const innerBody =
          node.callee.type === AST_NODE_TYPES.ArrowFunctionExpression
            ? node.callee.body
            : node.callee.body;

        if (
          subtreeHas(
            innerBody,
            (candidate) =>
              candidate.type === AST_NODE_TYPES.CallExpression &&
              isInlineFunction(candidate.callee),
          )
        ) {
          // Report the nested IIFE, not the outer shell.
          context.report({
            node,
            messageId: "noArrowLadder",
          });
        }
      },
    }),
  ),
  "no-branch-in-object": createEffectOnlyRule(
    "no-branch-in-object",
    "Disallow Match/Option/Either branching inside object literals.",
    "noBranchInObject",
    "Rule: avoid Match/Option/Either inside object literals. Why: it hides the decision and invites workaround scaffolding. Fix: compute the value first, then build the object from named values with one flat decision.",
    (context) => ({
      Property(node) {
        if (
          node.parent?.type !== AST_NODE_TYPES.ObjectExpression ||
          node.value.type === AST_NODE_TYPES.SpreadElement
        ) {
          return;
        }

        const valueText = context.sourceCode.getText(node.value);
        if (
          valueText.includes("Match.value(") ||
          valueText.includes("Option.match(") ||
          valueText.includes("Either.match(")
        ) {
          context.report({
            node,
            messageId: "noBranchInObject",
          });
        }
      },
    }),
  ),
  "no-call-tower": createEffectOnlyRule(
    "no-call-tower",
    "Disallow nested Effect call towers.",
    "noCallTower",
    "Rule: avoid nested Effect call towers (Effect.fn(Effect.fn(...))). Why: it hides sequencing. Fix: build the inner Effect first, then use pipe/Effect.flatMap/Effect.andThen for a single flat pipeline.",
    (context) => ({
      CallExpression(node) {
        if (!isEffectCall(node)) {
          return;
        }

        if (
          node.arguments.some((argument) => isEffectCall(argument)) ||
          subtreeHas(
            node.arguments,
            (candidate) => candidate !== node && isEffectCall(candidate),
          )
        ) {
          context.report({
            node,
            messageId: "noCallTower",
          });
        }
      },
    }),
  ),
  "no-effect-all-step-sequencing": createEffectOnlyRule(
    "no-effect-all-step-sequencing",
    "Disallow Effect.all when it encodes sequential side-effect steps.",
    "noEffectAllStepSequencing",
    "Rule: avoid Effect.all for sequential side-effect steps. Why: it hides imperative sequencing in an array. Fix: use one explicit linear pipeline with Effect.andThen/flatMap and reserve Effect.all for real value aggregation.",
    (context) => ({
      CallExpression(node) {
        if (!isNamespacedCall(node, "Effect", "all")) {
          return;
        }

        const firstArgument = node.arguments[0];
        if (
          !firstArgument ||
          firstArgument.type === AST_NODE_TYPES.SpreadElement
        ) {
          return;
        }

        const firstText = context.sourceCode.getText(firstArgument);
        const secondArgument = node.arguments[1];
        const secondText =
          secondArgument && secondArgument.type !== AST_NODE_TYPES.SpreadElement
            ? context.sourceCode.getText(secondArgument)
            : "";
        const parentText =
          node.parent && node.parent.type === AST_NODE_TYPES.MemberExpression
            ? context.sourceCode.getText(node.parent)
            : "";

        if (
          textIncludesAny(firstText, SEQUENCE_SIDE_EFFECT_FRAGMENTS) &&
          (secondText.includes("concurrency: 1") ||
            parentText.includes("Effect.asVoid"))
        ) {
          context.report({
            node,
            messageId: "noEffectAllStepSequencing",
          });
        }
      },
    }),
  ),
  "no-effect-as": createEffectOnlyRule(
    "no-effect-as",
    "Disallow Effect.as.",
    "noEffectAs",
    "Rule: avoid Effect.as. Why: it hides sequencing and turns effects into placeholders. Fix: use Effect.map for value mapping or Effect.asVoid after explicit pipeline steps.",
    (context) => ({
      CallExpression(node) {
        if (isNamespacedCall(node, "Effect", "as")) {
          context.report({
            node,
            messageId: "noEffectAs",
          });
        }
      },
    }),
  ),
  "no-effect-async": createEffectOnlyRule(
    "no-effect-async",
    "Disallow Effect.async.",
    "noEffectAsync",
    "Rule: avoid Effect.async. Why: callback-style wiring hides lifecycle and escapes declarative flow. Fix: use Stream or structured Effect lifecycles (acquire/use/release).",
    (context) => ({
      CallExpression(node) {
        if (isNamespacedCall(node, "Effect", "async")) {
          context.report({
            node,
            messageId: "noEffectAsync",
          });
        }
      },
    }),
  ),
  "no-effect-bind": createEffectOnlyRule(
    "no-effect-bind",
    "Disallow Effect.bind.",
    "noEffectBind",
    "Rule: avoid Effect.bind. Why: it hides sequencing inside builder-style accumulation. Fix: use one flat pipe-based Effect flow or one direct top-level Effect.gen with direct yields, not nested generators or wrapper helpers.",
    (context) => ({
      CallExpression(node) {
        if (isNamespacedCall(node, "Effect", "bind")) {
          context.report({
            node,
            messageId: "noEffectBind",
          });
        }
      },
    }),
  ),
  "no-effect-call-in-effect-arg": createEffectOnlyRule(
    "no-effect-call-in-effect-arg",
    "Disallow Effect calls nested directly inside Effect call arguments.",
    "noEffectCallInEffectArg",
    "Rule: avoid Effect calls nested as arguments (Effect.xx(Effect.yy(...))). Why: it hides sequencing. Fix: build the inner Effect first, then use pipe/Effect.flatMap/Effect.andThen to keep a single flat pipeline.",
    (context) => ({
      CallExpression(node) {
        if (!isEffectCall(node)) {
          return;
        }

        if (node.arguments.some((argument) => isEffectCall(argument))) {
          context.report({
            node,
            messageId: "noEffectCallInEffectArg",
          });
        }
      },
    }),
  ),
  "no-effect-do": createEffectOnlyRule(
    "no-effect-do",
    "Disallow Effect.Do.",
    "noEffectDo",
    "Rule: avoid Effect.Do. Why: it pushes Effect code toward imperative builder choreography. Fix: use one flat pipe-based Effect flow or one direct top-level Effect.gen with direct yields, not nested generators or wrapper helpers.",
    (context) => ({
      MemberExpression(node) {
        if (isNamespacedMember(node, "Effect", "Do")) {
          context.report({
            node,
            messageId: "noEffectDo",
          });
        }
      },
    }),
  ),
  "no-effect-fn-generator": createEffectOnlyRule(
    "no-effect-fn-generator",
    "Disallow generator functions passed to Effect.fn.",
    "noEffectFnGenerator",
    "Rule: avoid Effect.fn generator wrappers. Why: they hide sequencing and dodge ladder rules. Fix: keep a single flat pipeline or use one Effect.gen.",
    (context) => ({
      CallExpression(node) {
        if (!isNamespacedCall(node, "Effect", "fn")) {
          return;
        }

        const firstArgument = node.arguments[0];
        if (
          firstArgument &&
          firstArgument.type !== AST_NODE_TYPES.SpreadElement &&
          ((firstArgument.type === AST_NODE_TYPES.FunctionExpression &&
            firstArgument.generator) ||
            (firstArgument.type === AST_NODE_TYPES.ArrowFunctionExpression &&
              firstArgument.expression === false &&
              context.sourceCode
                .getText(firstArgument)
                .startsWith("function*")))
        ) {
          context.report({
            node,
            messageId: "noEffectFnGenerator",
          });
        }
      },
    }),
  ),
  "no-effect-ladder": createEffectOnlyRule(
    "no-effect-ladder",
    "Disallow nested Effect combinator ladders.",
    "noEffectLadder",
    "Rule: avoid nested Effect combinators. Why: they hide sequencing and create laddered control flow. Fix: build context once (Effect.all/Effect.map) and then run a single flat pipeline.",
    (context) => ({
      CallExpression(node) {
        if (!isEffectCall(node)) {
          return;
        }

        const nestedArgument = node.arguments.find(
          (argument) =>
            argument.type !== AST_NODE_TYPES.SpreadElement &&
            isEffectCall(argument),
        );

        if (
          nestedArgument &&
          subtreeHas(
            nestedArgument.arguments,
            (candidate) =>
              candidate !== nestedArgument && isEffectCall(candidate),
          )
        ) {
          context.report({
            node,
            messageId: "noEffectLadder",
          });
        }
      },
    }),
  ),
  "no-effect-never": createEffectOnlyRule(
    "no-effect-never",
    "Disallow Effect.never.",
    "noEffectNever",
    "Rule: avoid Effect.never. Why: it hides lifecycle and leaks resources. Fix: use Stream or explicit acquire/release lifecycles with clear teardown.",
    (context) => ({
      MemberExpression(node) {
        if (isNamespacedMember(node, "Effect", "never")) {
          context.report({
            node,
            messageId: "noEffectNever",
          });
        }
      },
    }),
  ),
  "no-effect-orElse-ladder": createEffectOnlyRule(
    "no-effect-orElse-ladder",
    "Disallow Effect.orElse around sequencing chains.",
    "noEffectOrElseLadder",
    "Rule: avoid Effect.orElse around sequencing chains. Why: it hides error handling and splits the flow. Fix: move error handling to a single terminal decision after the pipeline.",
    (context) => ({
      CallExpression(node) {
        if (!isNamespacedCall(node, "Effect", "orElse")) {
          return;
        }

        const firstArgument = node.arguments[0];
        if (
          !firstArgument ||
          firstArgument.type === AST_NODE_TYPES.SpreadElement
        ) {
          return;
        }

        const text = context.sourceCode.getText(firstArgument);
        if (
          textIncludesAny(text, [
            "Effect.flatMap(",
            "Effect.zipRight(",
            "Effect.as(",
            "Effect.tap(",
          ])
        ) {
          context.report({
            node,
            messageId: "noEffectOrElseLadder",
          });
        }
      },
    }),
  ),
  "no-effect-side-effect-wrapper": createEffectOnlyRule(
    "no-effect-side-effect-wrapper",
    "Disallow Effect.as and Effect.zipRight around side-effect wrappers.",
    "noEffectSideEffectWrapper",
    "Rule: avoid Effect.as/Effect.zipRight for side effects. Why: it hides side effects and discards values. Fix: use explicit pipeline steps that return real values (Effect.flatMap/andThen/tap).",
    (context) => ({
      CallExpression(node) {
        if (
          !isNamespacedCall(node, "Effect", "as") &&
          !isNamespacedCall(node, "Effect", "zipRight")
        ) {
          return;
        }

        const firstArgument = node.arguments[0];
        if (
          !firstArgument ||
          firstArgument.type === AST_NODE_TYPES.SpreadElement
        ) {
          return;
        }

        const text = context.sourceCode.getText(firstArgument);
        if (textIncludesAny(text, SIDE_EFFECT_FRAGMENTS)) {
          context.report({
            node,
            messageId: "noEffectSideEffectWrapper",
          });
        }
      },
    }),
  ),
  "no-effect-succeed-variable": createEffectOnlyRule(
    "no-effect-succeed-variable",
    "Warn on Effect.succeed(variable)-style branch placeholders.",
    "noEffectSucceedVariable",
    "Rule: avoid Effect.succeed(variable) as a branch placeholder. Why: it hides a decision and turns data into pseudo-control flow. Fix: select a plain value and then run one Effect pipeline after the decision.",
    (context) => ({
      CallExpression(node) {
        if (!isNamespacedCall(node, "Effect", "succeed")) {
          return;
        }

        const firstArgument = node.arguments[0];
        if (
          !firstArgument ||
          firstArgument.type === AST_NODE_TYPES.SpreadElement
        ) {
          return;
        }

        if (
          firstArgument.type !== AST_NODE_TYPES.ObjectExpression &&
          firstArgument.type !== AST_NODE_TYPES.ArrayExpression &&
          firstArgument.type !== AST_NODE_TYPES.CallExpression &&
          firstArgument.type !== AST_NODE_TYPES.ConditionalExpression
        ) {
          context.report({
            node,
            messageId: "noEffectSucceedVariable",
          });
        }
      },
    }),
    "suggestion",
  ),
  "no-effect-sync-console": createEffectOnlyRule(
    "no-effect-sync-console",
    "Disallow console.* inside Effect.sync.",
    "noEffectSyncConsole",
    "Rule: avoid console.* inside Effect.sync. Why: it hides side effects. Fix: replace with Effect.log* or remove the console call.",
    (context) => ({
      CallExpression(node) {
        if (!isNamespacedCall(node, "Effect", "sync")) {
          return;
        }

        const firstArgument = node.arguments[0];
        if (
          !firstArgument ||
          firstArgument.type === AST_NODE_TYPES.SpreadElement
        ) {
          return;
        }

        if (context.sourceCode.getText(firstArgument).includes("console.")) {
          context.report({
            node,
            messageId: "noEffectSyncConsole",
          });
        }
      },
    }),
  ),
  "no-effect-wrapper-alias": createEffectOnlyRule(
    "no-effect-wrapper-alias",
    "Disallow local wrapper aliases that only return Effect pipelines.",
    "noEffectWrapperAlias",
    "Rule: avoid Effect wrapper aliases. Why: it creates wrapper choreography and bloats consts. Fix: inline the pipeline at the call site or define a real domain function that returns data, not an Effect wrapper.",
    (context) => ({
      VariableDeclarator(node) {
        if (!node.init) {
          return;
        }

        if (
          (node.init.type === AST_NODE_TYPES.CallExpression &&
            isPipeCall(node.init) &&
            context.sourceCode.getText(node.init).includes("Effect.")) ||
          (node.init.type === AST_NODE_TYPES.CallExpression &&
            isEffectCall(node.init)) ||
          (node.init.type === AST_NODE_TYPES.ArrowFunctionExpression &&
            (context.sourceCode.getText(node.init.body).includes("Effect.") ||
              context.sourceCode.getText(node.init.body).includes("pipe(")))
        ) {
          context.report({
            node,
            messageId: "noEffectWrapperAlias",
          });
        }
      },
      FunctionDeclaration(node) {
        if (
          node.body &&
          textIncludesAny(context.sourceCode.getText(node.body), [
            "Effect.",
            "pipe(",
          ])
        ) {
          context.report({
            node,
            messageId: "noEffectWrapperAlias",
          });
        }
      },
    }),
  ),
  "no-flatmap-ladder": createEffectOnlyRule(
    "no-flatmap-ladder",
    "Warn on nested Effect.flatMap and map+flatten ladders.",
    "noFlatMapLadder",
    "Rule: avoid nested Effect.flatMap or map+flatten ladders. Why: they hide sequencing and push laddered control flow. Fix: build context once (Effect.all/Effect.map) and run a single flatMap.",
    (context) => ({
      CallExpression(node) {
        if (
          isNamespacedCall(node, "Effect", "flatMap") &&
          subtreeHas(
            node.arguments,
            (candidate) =>
              candidate !== node &&
              isNamespacedCall(candidate, "Effect", "flatMap"),
          )
        ) {
          context.report({
            node,
            messageId: "noFlatMapLadder",
          });
          return;
        }

        if (
          isNamespacedCall(node, "Effect", "flatten") &&
          subtreeHas(node.arguments, (candidate) =>
            isNamespacedCall(candidate, "Effect", "map"),
          )
        ) {
          context.report({
            node,
            messageId: "noFlatMapLadder",
          });
        }
      },
    }),
    "suggestion",
  ),
  "no-if-statement": createEffectOnlyRule(
    "no-if-statement",
    "Disallow if statements in Effect-oriented files.",
    "noIfStatement",
    "Rule: avoid imperative if branching. Why: it hides control flow in Effect code. Fix: use Option.match/Either.match/Match.value or data combinators, then run one Effect pipeline.",
    (context) => ({
      IfStatement(node) {
        context.report({
          node: node.test,
          messageId: "noIfStatement",
        });
      },
    }),
  ),
  "no-iife-wrapper": createEffectOnlyRule(
    "no-iife-wrapper",
    "Disallow immediate invocation of inline functions.",
    "noIifeWrapper",
    "Rule: avoid immediate invocation of inline functions. Why: it hides decisions and sequencing. Fix: bind a named context with const and keep one Match/Option decision in a flat pipeline.",
    (context) => ({
      CallExpression(node) {
        if (isInlineFunction(node.callee)) {
          context.report({
            node,
            messageId: "noIifeWrapper",
          });
        }
      },
    }),
  ),
  "no-manual-effect-channels": createEffectOnlyRule(
    "no-manual-effect-channels",
    "Disallow manual Effect.Effect and Layer.Layer channel tuples in types.",
    "noManualEffectChannels",
    "Rule: avoid manual Effect channel tuples (`Effect.Effect<...>` / `Layer.Layer<...>`). Why: channels compose through the Effect pipeline and services; hand-written tuples desync from the real flow. Fix: drop the generic and let the return type infer from the Effect/Layer you return.",
    (context) => ({
      TSTypeReference(node) {
        const typeText = context.sourceCode.getText(node.typeName);
        if (typeText === "Effect.Effect" || typeText === "Layer.Layer") {
          context.report({
            node,
            messageId: "noManualEffectChannels",
          });
        }
      },
    }),
  ),
  "no-match-effect-branch": createEffectOnlyRule(
    "no-match-effect-branch",
    "Disallow multi-step Effect sequencing inside Match and Option branches.",
    "noMatchEffectBranch",
    "Rule: avoid multi-step sequencing inside Match/Option branches. Why: it hides control flow. Fix: select a value in Match/Option, then run one Effect pipeline outside.",
    (context) => ({
      CallExpression(node) {
        if (
          isPipeCall(node) &&
          context.sourceCode.getText(node.callee).includes("Match.value(")
        ) {
          const text = context.sourceCode.getText(node);
          if (
            text.includes("Match.when") &&
            branchContainsSequencing(context, node)
          ) {
            context.report({
              node,
              messageId: "noMatchEffectBranch",
            });
          }
          return;
        }

        if (
          isNamespacedCall(node, "Option", "match") &&
          branchContainsSequencing(context, node)
        ) {
          context.report({
            node,
            messageId: "noMatchEffectBranch",
          });
        }
      },
    }),
  ),
  "no-match-void-branch": createEffectOnlyRule(
    "no-match-void-branch",
    "Disallow Match branches that return Effect.void.",
    "noMatchVoidBranch",
    "Rule: avoid void Match branches. Why: they hide guard-style control flow. Fix: remove the no-op branch or select a value and run one Effect pipeline outside the Match.",
    (context) => ({
      CallExpression(node) {
        if (
          !isNamespacedCall(node, "Match", "when") &&
          !isNamespacedCall(node, "Match", "orElse")
        ) {
          return;
        }

        const handler = node.arguments.at(-1);
        if (!handler || handler.type === AST_NODE_TYPES.SpreadElement) {
          return;
        }

        const text = context.sourceCode.getText(handler);
        if (text.includes("Effect.void")) {
          context.report({
            node,
            messageId: "noMatchVoidBranch",
          });
        }
      },
    }),
  ),
  "no-nested-effect-call": createEffectOnlyRule(
    "no-nested-effect-call",
    "Disallow deeply nested Effect calls.",
    "noNestedEffectCall",
    "Rule: avoid deeply nested Effect calls (Effect.xx(Effect.yy(Effect.zz(...)))). Why: they hide sequencing and spread flow. Fix: build values first, then run one flat Effect pipeline.",
    (context) => ({
      CallExpression(node) {
        if (!isEffectCall(node)) {
          return;
        }

        if (
          subtreeHas(
            node.arguments,
            (candidate) => candidate !== node && isEffectCall(candidate),
          ) &&
          subtreeHas(
            node.arguments,
            (candidate) =>
              candidate !== node &&
              candidate.type === AST_NODE_TYPES.CallExpression &&
              subtreeHas(
                candidate.arguments,
                (inner) => inner !== candidate && isEffectCall(inner),
              ),
          )
        ) {
          context.report({
            node,
            messageId: "noNestedEffectCall",
          });
        }
      },
    }),
  ),
  "no-nested-effect-gen": createEffectOnlyRule(
    "no-nested-effect-gen",
    "Disallow nested Effect.gen calls.",
    "noNestedEffectGen",
    "Rule: avoid nested Effect.gen. Why: nested generators hide sequencing. Fix: flatten to a single Effect.gen per method or a single flat pipeline.",
    (context) => ({
      CallExpression(node) {
        if (!isNamespacedCall(node, "Effect", "gen")) {
          return;
        }

        const firstArgument = node.arguments[0];
        if (
          firstArgument &&
          firstArgument.type !== AST_NODE_TYPES.SpreadElement &&
          subtreeHas(
            firstArgument,
            (candidate) =>
              candidate !== node &&
              isNamespacedCall(candidate, "Effect", "gen"),
          )
        ) {
          context.report({
            node,
            messageId: "noNestedEffectGen",
          });
        }
      },
    }),
  ),
  "no-option-as": createEffectOnlyRule(
    "no-option-as",
    "Disallow Option.as.",
    "noOptionAs",
    "Rule: avoid Option.as. Why: it hides selection and encourages placeholder flows. Fix: use Option.map or Option.match and return the value explicitly.",
    (context) => ({
      CallExpression(node) {
        if (isNamespacedCall(node, "Option", "as")) {
          context.report({
            node,
            messageId: "noOptionAs",
          });
        }
      },
    }),
  ),
  "no-pipe-ladder": createEffectOnlyRule(
    "no-pipe-ladder",
    "Disallow nested pipe chains.",
    "noPipeLadder",
    "Rule: avoid nested pipe() chains. Why: they hide sequencing. Fix: refactor into one flat pipeline with a single decision point.",
    (context) => ({
      CallExpression(node) {
        if (!isPipeCall(node)) {
          return;
        }

        if (
          subtreeHas(
            node.arguments,
            (candidate) => candidate !== node && isPipeCall(candidate),
          )
        ) {
          context.report({
            node,
            messageId: "noPipeLadder",
          });
        }
      },
    }),
  ),
  "no-return-in-arrow": createEffectOnlyRule(
    "no-return-in-arrow",
    "Warn on block-bodied arrow callbacks with explicit returns.",
    "noReturnInArrow",
    "Rule: avoid block-bodied arrow callbacks with returns. Why: they hide local control flow. Fix: use expression-only callbacks and move the logic into a single pipeline.",
    (context) => ({
      CallExpression(node) {
        const calleeText = context.sourceCode.getText(node.callee);
        if (calleeText === "S.filter" || calleeText === "Schema.filter") {
          return;
        }

        for (const argument of node.arguments) {
          if (
            argument.type !== AST_NODE_TYPES.SpreadElement &&
            argument.type === AST_NODE_TYPES.ArrowFunctionExpression &&
            blockContainsReturn(argument.body)
          ) {
            context.report({
              node: argument.body,
              messageId: "noReturnInArrow",
            });
          }
        }
      },
    }),
    "suggestion",
  ),
  "no-return-in-callback": createEffectOnlyRule(
    "no-return-in-callback",
    "Warn on returns inside inline function callbacks.",
    "noReturnInCallback",
    "Rule: avoid returns inside inline callbacks. Why: they hide control flow. Prefer expression-only callbacks, but leaf-level Effect branches with local bindings may use returns when needed.",
    (context) => ({
      CallExpression(node) {
        for (const argument of node.arguments) {
          if (
            argument.type !== AST_NODE_TYPES.SpreadElement &&
            argument.type === AST_NODE_TYPES.FunctionExpression &&
            blockContainsReturn(argument.body)
          ) {
            context.report({
              node: argument.body,
              messageId: "noReturnInCallback",
            });
          }
        }
      },
    }),
    "suggestion",
  ),
  "no-return-null": createEffectOnlyRule(
    "no-return-null",
    "Disallow return null in Effect-oriented files.",
    "noReturnNull",
    "Rule: avoid returning null. Why: null is a sentinel that forces defensive guards. Fix: use Option.none for absence or Effect.fail for errors.",
    (context) => ({
      ReturnStatement(node) {
        if (isNullLiteral(node.argument)) {
          context.report({
            node,
            messageId: "noReturnNull",
          });
        }
      },
    }),
  ),
  "no-runtime-runfork": createEffectOnlyRule(
    "no-runtime-runfork",
    "Disallow Runtime.runFork.",
    "noRuntimeRunFork",
    "Rule: avoid Runtime.runFork. Why: it escapes structured concurrency. Fix: use forkScoped, Stream, or runtime-provided layers instead.",
    (context) => ({
      CallExpression(node) {
        if (isNamespacedCall(node, "Runtime", "runFork")) {
          context.report({
            node,
            messageId: "noRuntimeRunFork",
          });
        }
      },
    }),
  ),
  "no-string-sentinel-const": createEffectOnlyRule(
    "no-string-sentinel-const",
    "Disallow string sentinel constants.",
    "noStringSentinelConst",
    "Rule: avoid string status constants. Why: they encode control flow and force defensive branching. Fix: use tagged unions, Option/Either, or meaningful domain values instead of string tokens.",
    (context) => ({
      VariableDeclarator(node) {
        if (
          node.parent?.type === AST_NODE_TYPES.VariableDeclaration &&
          node.parent.kind === "const" &&
          isStringLiteral(node.init)
        ) {
          context.report({
            node,
            messageId: "noStringSentinelConst",
          });
        }
      },
    }),
  ),
  "no-string-sentinel-return": createEffectOnlyRule(
    "no-string-sentinel-return",
    "Disallow Effect.succeed of string sentinel tokens.",
    "noStringSentinelReturn",
    "Rule: avoid returning string tokens. Why: it encodes control flow and forces defensive branching. Fix: return domain values (Option/Either/tagged unions) or real Effect results instead.",
    (context) => ({
      CallExpression(node) {
        if (
          isNamespacedCall(node, "Effect", "succeed") &&
          isStringLiteral(node.arguments[0] as TSESTree.Node | undefined)
        ) {
          context.report({
            node,
            messageId: "noStringSentinelReturn",
          });
        }
      },
    }),
  ),
  "no-switch-statement": createEffectOnlyRule(
    "no-switch-statement",
    "Disallow switch statements in Effect-oriented files.",
    "noSwitchStatement",
    "Rule: avoid imperative switch branching. Why: it hides control flow in Effect code and encourages case-by-case sequencing. Fix: use Match.value, Option.match, Either.match, or Effect.if, then run one explicit pipeline.",
    (context) => ({
      SwitchStatement(node) {
        context.report({
          node: node.discriminant,
          messageId: "noSwitchStatement",
        });
      },
    }),
  ),
  "no-ternary": createEffectOnlyRule(
    "no-ternary",
    "Disallow ternary expressions in Effect-oriented files.",
    "noTernary",
    "Rule: avoid ternary expressions. Why: they hide control flow inside expressions. Fix: use Option.match/Either.match/Match.value or data combinators, then run one Effect pipeline.",
    (context) => ({
      ConditionalExpression(node) {
        context.report({
          node: node.test,
          messageId: "noTernary",
        });
      },
    }),
  ),
  "no-try-catch": createEffectOnlyRule(
    "no-try-catch",
    "Disallow try/catch in Effect-oriented files.",
    "noTryCatch",
    "Rule: avoid try/catch in Effect files. Why: it bypasses Effect error channels and reintroduces imperative control flow. Fix: model failures in Effect and handle them with typed errors and Effect combinators.",
    (context) => ({
      TryStatement(node) {
        context.report({
          node,
          messageId: "noTryCatch",
        });
      },
    }),
  ),
  "prevent-dynamic-imports": createRule({
    name: "prevent-dynamic-imports",
    meta: {
      type: "problem",
      docs: {
        description: "Disallow dynamic imports.",
        recommended: false,
        requiresTypeChecking: false,
      },
      schema: [],
      messages: {
        preventDynamicImports:
          "Rule: avoid dynamic module imports. Why: they hide dependencies and control flow behind deferred module loading. Fix: use static module imports so dependencies stay explicit at the file boundary.",
      },
    },
    defaultOptions: [],
    create(context) {
      return {
        ImportExpression(node) {
          context.report({
            node,
            messageId: "preventDynamicImports",
          });
        },
      };
    },
  }),
  "warn-effect-sync-wrapper": createEffectOnlyRule(
    "warn-effect-sync-wrapper",
    "Warn on Effect.sync wrappers around side-effect calls.",
    "warnEffectSyncWrapper",
    "Rule: avoid Effect.sync around side effects. Why: it hides intent. Fix: use Effect.log* or an explicit pipeline step for the side effect.",
    (context) => ({
      CallExpression(node) {
        if (!isNamespacedCall(node, "Effect", "sync")) {
          return;
        }

        const firstArgument = node.arguments[0];
        if (
          !firstArgument ||
          firstArgument.type === AST_NODE_TYPES.SpreadElement
        ) {
          return;
        }

        if (
          firstArgument.type === AST_NODE_TYPES.ArrowFunctionExpression &&
          firstArgument.expression &&
          firstArgument.body.type === AST_NODE_TYPES.CallExpression &&
          !(
            firstArgument.body.callee.type ===
              AST_NODE_TYPES.MemberExpression &&
            firstArgument.body.callee.object.type ===
              AST_NODE_TYPES.Identifier &&
            firstArgument.body.callee.object.name === "console"
          )
        ) {
          context.report({
            node,
            messageId: "warnEffectSyncWrapper",
          });
        }
      },
    }),
    "suggestion",
  ),
};
