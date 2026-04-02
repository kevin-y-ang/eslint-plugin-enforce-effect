import { ESLintUtils } from "@typescript-eslint/utils";

export interface EnforceEffectRuleDocs {
  description: string;
  recommended?: boolean;
  requiresTypeChecking?: boolean;
}

export const createRule = ESLintUtils.RuleCreator<EnforceEffectRuleDocs>(
  (name) =>
    `https://github.com/bytedance/eslint-plugin-enforce-effect/blob/main/docs/rules/${name}.md`,
);
