import fs from "node:fs";

import accountabilityRules from "./rules/accountability/index.js";
import banVanillaRules from "./rules/ban-vanilla/index.js";
import {
  catenarycloudCoreRuleNames,
  catenarycloudFullRuleNames,
  catenarycloudTsTypeRuleNames,
  catenarycloudWebRuleNames,
} from "./rules/catenarycloud/index.js";
import rules from "./rules/index.js";

const pkg = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as {
  name: string;
  version: string;
};

const namespace = "enforce-effect";

const banVanillaRuleNames = new Set(Object.keys(banVanillaRules));

function severityFor(ruleName: string): "error" | "warn" {
  return banVanillaRuleNames.has(ruleName) ? "error" : "warn";
}

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
        ruleNames.map((ruleName) => [
          `${namespace}/${ruleName}`,
          severityFor(ruleName),
        ]),
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

const recommendedRuleNames = [
  "no-date",
  "no-error",
  "no-explicit-function-return-type",
  "no-for",
  "no-fs",
  "no-json-parse",
  "no-null",
  "no-nullish-coalescing",
  "no-node-child-process",
  "no-optional-chaining",
  "no-promise",
  "no-process-env",
  "no-switch",
  "no-throw",
  "no-type-assertion",
  "no-try",
  "no-undefined",
] as const;

const recommended = configFromRuleNames(
  "enforce-effect/recommended",
  recommendedRuleNames,
);

const recommendedTypeCheckedRuleNames = [
  "no-date-inferred",
  "no-error-inferred",
  "no-null-inferred",
  "no-promise-inferred",
  "no-undefined-inferred",
] as const;

const recommendedTypeChecked = configFromRuleNames(
  "enforce-effect/recommended-type-checked",
  recommendedTypeCheckedRuleNames,
);

const accountability = [
  {
    name: "enforce-effect/accountability",
    plugins: {
      [namespace]: plugin,
    },
    rules: Object.fromEntries(
      Object.keys(accountabilityRules).map((ruleName) => [
        `${namespace}/${ruleName}`,
        severityFor(ruleName),
      ]),
    ),
  },
];

const catenarycloudCore = configFromRuleNames(
  "enforce-effect/catenarycloud-core",
  catenarycloudCoreRuleNames,
);

const catenarycloudWeb = configFromRuleNames(
  "enforce-effect/catenarycloud-web",
  catenarycloudWebRuleNames,
);
const catenarycloudTsType = configFromRuleNames(
  "enforce-effect/catenarycloud-ts-type",
  catenarycloudTsTypeRuleNames,
);
const catenarycloudFull = configFromRuleNames(
  "enforce-effect/catenarycloud-full",
  catenarycloudFullRuleNames,
);

plugin.configs = {
  accountability,
  "catenarycloud-core": catenarycloudCore,
  "catenarycloud-full": catenarycloudFull,
  "catenarycloud-ts-type": catenarycloudTsType,
  "catenarycloud-web": catenarycloudWeb,
  recommended,
  recommendedTypeChecked,
};

export default plugin;
export {
  accountability,
  recommended,
  recommendedTypeChecked,
  catenarycloudCore,
  catenarycloudFull,
  catenarycloudTsType,
  catenarycloudWeb,
  rules,
};
