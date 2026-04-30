import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";
import type { ParserServicesWithTypeInformation } from "@typescript-eslint/utils";
import * as ts from "typescript";

export function* iterateBindingIdentifiers(
  pattern: TSESTree.DestructuringPattern | TSESTree.Parameter,
): Generator<TSESTree.Identifier> {
  switch (pattern.type) {
    case AST_NODE_TYPES.Identifier:
      yield pattern;
      return;
    case AST_NODE_TYPES.ArrayPattern:
      for (const element of pattern.elements) {
        if (element) {
          yield* iterateBindingIdentifiers(element);
        }
      }
      return;
    case AST_NODE_TYPES.ObjectPattern:
      for (const property of pattern.properties) {
        if (property.type === AST_NODE_TYPES.Property) {
          if (
            property.value.type === AST_NODE_TYPES.Identifier ||
            property.value.type === AST_NODE_TYPES.ArrayPattern ||
            property.value.type === AST_NODE_TYPES.ObjectPattern ||
            property.value.type === AST_NODE_TYPES.AssignmentPattern
          ) {
            yield* iterateBindingIdentifiers(property.value);
          }
          continue;
        }
        yield* iterateBindingIdentifiers(property);
      }
      return;
    case AST_NODE_TYPES.RestElement:
      if (pattern.argument.type !== AST_NODE_TYPES.MemberExpression) {
        yield* iterateBindingIdentifiers(pattern.argument);
      }
      return;
    case AST_NODE_TYPES.AssignmentPattern:
      yield* iterateBindingIdentifiers(pattern.left);
      return;
    case AST_NODE_TYPES.TSParameterProperty:
      yield* iterateBindingIdentifiers(pattern.parameter);
      return;
  }
}

type FunctionLikeWithParams =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

export interface CreateTypeAwareAnchorVisitorsOptions<
  MessageId extends string,
> {
  messageId: MessageId;
  isBannedType: (type: ts.Type, checker: ts.TypeChecker) => boolean;
}

/**
 * Build the AST visitors that walk every value-bearing anchor (variable
 * declarators, class fields, function parameters, function return types) and
 * report when the inferred TypeScript type contains a banned type. Returned as
 * a plain visitor map so that callers can merge it with their own syntactic
 * visitors via {@link mergeRuleListeners}.
 */
export function createTypeAwareAnchorVisitors<MessageId extends string>(
  context: TSESLint.RuleContext<MessageId, []>,
  options: CreateTypeAwareAnchorVisitorsOptions<MessageId>,
): TSESLint.RuleListener {
  const services: ParserServicesWithTypeInformation =
    ESLintUtils.getParserServices(context);
  const checker = services.program.getTypeChecker();

  function containsBanned(
    type: ts.Type,
    seen: Set<ts.Type> = new Set(),
  ): boolean {
    if (seen.has(type)) {
      return false;
    }

    seen.add(type);

    if (options.isBannedType(type, checker)) {
      return true;
    }

    if (type.isUnion() || type.isIntersection()) {
      return type.types.some((subType) => containsBanned(subType, seen));
    }

    if (checker.isArrayType(type) || checker.isTupleType(type)) {
      return checker
        .getTypeArguments(type as ts.TypeReference)
        .some((subType) => containsBanned(subType, seen));
    }

    return false;
  }

  function reportIfBanned(node: TSESTree.Node): void {
    const type = services.getTypeAtLocation(node);

    if (!containsBanned(type)) {
      return;
    }

    context.report({
      node,
      messageId: options.messageId,
    });
  }

  function checkBindingPattern(
    pattern: TSESTree.DestructuringPattern | TSESTree.Parameter,
  ): void {
    for (const identifier of iterateBindingIdentifiers(pattern)) {
      reportIfBanned(identifier);
    }
  }

  function checkFunctionReturnType(node: FunctionLikeWithParams): void {
    const tsNode = services.esTreeNodeToTSNodeMap.get(node);

    if (!ts.isFunctionLike(tsNode)) {
      return;
    }

    const signature = checker.getSignatureFromDeclaration(tsNode);

    if (!signature) {
      return;
    }

    const returnType = signature.getReturnType();

    if (!containsBanned(returnType)) {
      return;
    }

    context.report({
      node,
      messageId: options.messageId,
    });
  }

  function checkFunctionLike(node: FunctionLikeWithParams): void {
    for (const param of node.params) {
      checkBindingPattern(param);
    }

    checkFunctionReturnType(node);
  }

  return {
    ArrowFunctionExpression(node) {
      checkFunctionLike(node);
    },
    FunctionDeclaration(node) {
      checkFunctionLike(node);
    },
    FunctionExpression(node) {
      checkFunctionLike(node);
    },
    PropertyDefinition(node) {
      reportIfBanned(node.key);
    },
    VariableDeclarator(node) {
      checkBindingPattern(node.id);
    },
  };
}

/**
 * Merge two or more ESLint visitor maps into a single map. When multiple
 * inputs register a handler for the same selector, the merged handler invokes
 * each in turn so that all reports are still emitted.
 */
export function mergeRuleListeners(
  ...listeners: ReadonlyArray<TSESLint.RuleListener>
): TSESLint.RuleListener {
  const merged: Record<string, Array<(...args: unknown[]) => void>> = {};

  for (const listener of listeners) {
    for (const [selector, handler] of Object.entries(listener)) {
      if (typeof handler !== "function") {
        continue;
      }

      const handlers = (merged[selector] ??= []);
      handlers.push(handler as (...args: unknown[]) => void);
    }
  }

  const result: Record<string, (...args: unknown[]) => void> = {};

  for (const [selector, handlers] of Object.entries(merged)) {
    if (handlers.length === 1) {
      const onlyHandler = handlers[0];
      if (onlyHandler) {
        result[selector] = onlyHandler;
      }
      continue;
    }

    result[selector] = (...args: unknown[]) => {
      for (const handler of handlers) {
        handler(...args);
      }
    };
  }

  return result as TSESLint.RuleListener;
}

export function isDeclaredInTsLib(symbol: ts.Symbol): boolean {
  const declarations = symbol.getDeclarations();

  if (!declarations || declarations.length === 0) {
    return false;
  }

  return declarations.some((declaration) => {
    const sourceFile = declaration.getSourceFile();

    if (!sourceFile.isDeclarationFile) {
      return false;
    }

    return /(?:^|[/\\])lib\.[^/\\]+\.d\.ts$/.test(sourceFile.fileName);
  });
}
