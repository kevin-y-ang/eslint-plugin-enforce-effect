import fs from "node:fs";

import rules from "./rules/index.js";

const pkg = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as {
  name: string;
  version: string;
};

const namespace = "enforce-effect";

function configFromRuleNames(
  configName: string,
  ruleNames: readonly string[],
) {
  return [
    {
      name: configName,
      plugins: {
        [namespace]: plugin,
      },
      rules: Object.fromEntries(
        ruleNames.map((ruleName) => [`${namespace}/${ruleName}`, "error"]),
      ),
    },
  ];
}

const plugin = {
  meta: {
    name: pkg.name,
    version: pkg.version,
    namespace,
  },
  configs: {},
  rules,
  processors: {},
};

// Rules in `recommended` that have a type-aware `*-type-checked` superset. The
// type-checked variant supersedes the syntactic one, so the
// `recommendedTypeChecked` config swaps each of these for its type-checked
// counterpart rather than running both.
const TYPE_CHECKED_SUPERSEDES = {
  "no-date": "no-date-type-checked",
  "no-error": "no-error-type-checked",
  "no-null": "no-null-type-checked",
  "no-promise": "no-promise-type-checked",
  "no-undefined": "no-undefined-type-checked",
} as const;

const recommendedRuleNames = [
  "no-console",
  "no-crypto",
  "no-date",
  "no-error",
  "no-explicit-function-return-type",
  "no-fetch",
  "no-for",
  "no-fs",
  "no-json-parse",
  "no-json-stringify",
  "no-math-random",
  "no-null",
  "no-nullish-coalescing",
  "no-node-child-process",
  "no-optional-chaining",
  "no-performance-now",
  "no-promise",
  "no-process-env",
  "no-switch",
  "no-throw",
  "no-timers",
  "no-type-assertion",
  "no-try",
  "no-undefined",
  "require-eslint-disable-justification",
] as const;

const recommended = configFromRuleNames(
  "enforce-effect/recommended",
  recommendedRuleNames,
);

const recommendedTypeCheckedRuleNames = recommendedRuleNames.map(
  (ruleName): string =>
    ruleName in TYPE_CHECKED_SUPERSEDES
      ? TYPE_CHECKED_SUPERSEDES[ruleName as keyof typeof TYPE_CHECKED_SUPERSEDES]
      : ruleName,
);

const recommendedTypeChecked = configFromRuleNames(
  "enforce-effect/recommended-type-checked",
  recommendedTypeCheckedRuleNames,
);

plugin.configs = {
  recommended,
  recommendedTypeChecked,
};

export default plugin;
export { recommended, recommendedTypeChecked, rules };
