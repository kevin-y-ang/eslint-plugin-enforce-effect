import {
  AST_NODE_TYPES,
  ESLintUtils,
  TSESTree,
} from "@typescript-eslint/utils";
import type { ParserServicesWithTypeInformation } from "@typescript-eslint/utils";
import * as ts from "typescript";

import { createRule } from "../../utils/create-rule.js";

function isGlobalDateType(type: ts.Type): boolean {
  const symbol = type.getSymbol() ?? type.aliasSymbol;

  if (!symbol || symbol.getName() !== "Date") {
    return false;
  }

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

function containsDate(
  type: ts.Type,
  checker: ts.TypeChecker,
  seen: Set<ts.Type> = new Set(),
): boolean {
  if (seen.has(type)) {
    return false;
  }

  seen.add(type);

  if (isGlobalDateType(type)) {
    return true;
  }

  if (type.isUnion() || type.isIntersection()) {
    return type.types.some((subType) => containsDate(subType, checker, seen));
  }

  if (checker.isArrayType(type) || checker.isTupleType(type)) {
    return checker
      .getTypeArguments(type as ts.TypeReference)
      .some((subType) => containsDate(subType, checker, seen));
  }

  return false;
}

function* iterateBindingIdentifiers(
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

export default createRule({
  name: "no-date-inferred",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow values whose inferred TypeScript type is `Date` in favor of Effect-based date and clock primitives.",
      recommended: false,
      requiresTypeChecking: true,
    },
    schema: [],
    messages: {
      noDateInferred:
        "The user prefers Effect primitives like `DateTime.DateTime`, `DateTime.Utc`, or `DateTime.Zoned` over values whose TypeScript type is the vanilla `Date`. Convert at the boundary with `DateTime.fromDateUnsafe` or `DateTime.make`. If this logic cannot be implemented with any of these primitives, use `// eslint-disable-next-line no-date-inferred -- <justification>` as a LAST RESORT. The justification MUST explain why none of these primitives accomplish your goal, and MUST be no less than 40 characters. See /Users/bytedance/eslint-plugin-enforce-effect/docs/rules/no-date-inferred.md",
    },
  },
  defaultOptions: [],
  create(context) {
    const services: ParserServicesWithTypeInformation =
      ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    function reportIfDate(node: TSESTree.Node): void {
      const type = services.getTypeAtLocation(node);

      if (!containsDate(type, checker)) {
        return;
      }

      context.report({
        node,
        messageId: "noDateInferred",
      });
    }

    function checkBindingPattern(
      pattern: TSESTree.DestructuringPattern | TSESTree.Parameter,
    ): void {
      for (const identifier of iterateBindingIdentifiers(pattern)) {
        reportIfDate(identifier);
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

      if (!containsDate(returnType, checker)) {
        return;
      }

      context.report({
        node,
        messageId: "noDateInferred",
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
        reportIfDate(node.key);
      },
      VariableDeclarator(node) {
        checkBindingPattern(node.id);
      },
    };
  },
});
