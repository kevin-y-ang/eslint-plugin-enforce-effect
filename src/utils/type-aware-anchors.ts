import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import type { ParserServicesWithTypeInformation } from "@typescript-eslint/utils";
import * as ts from "typescript";

import { createRule } from "./create-rule.js";

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

export interface CreateTypeAwareAnchorRuleOptions<
  MessageId extends string,
> {
  name: string;
  description: string;
  messageId: MessageId;
  message: string;
  isBannedType: (type: ts.Type, checker: ts.TypeChecker) => boolean;
}

export function createTypeAwareAnchorRule<MessageId extends string>(
  options: CreateTypeAwareAnchorRuleOptions<MessageId>,
) {
  const messages = { [options.messageId]: options.message } as Record<
    MessageId,
    string
  >;

  return createRule<[], MessageId>({
    name: options.name,
    meta: {
      type: "suggestion",
      docs: {
        description: options.description,
        recommended: false,
        requiresTypeChecking: true,
      },
      schema: [],
      messages,
    },
    defaultOptions: [],
    create(context) {
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
          return type.types.some((subType) =>
            containsBanned(subType, seen),
          );
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
    },
  });
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
