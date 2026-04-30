import { ESLintUtils } from "@typescript-eslint/utils";

export interface EnforceEffectRuleDocs {
  description: string;
  recommended?: boolean;
  requiresTypeChecking?: boolean;
}

export const createRule = ESLintUtils.RuleCreator<EnforceEffectRuleDocs>(
  (name) =>
    `https://github.com/kevin-y-ang/eslint-plugin-enforce-effect/blob/master/docs/rules/${name}.md`,
);
