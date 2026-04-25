import fs from "node:fs";

import accountabilityRules from "./rules/accountability/index.js";
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

function configFromRuleNames(
  configName: string,
  ruleNames: readonly string[],
  warnRuleNames: readonly string[] = [],
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
          warnRuleNames.includes(ruleName) ? "warn" : "error",
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

const recommended = [
  {
    name: "enforce-effect/recommended",
    plugins: {
      [namespace]: plugin,
    },
    rules: {
      [`${namespace}/no-error`]: "error",
      [`${namespace}/no-explicit-function-return-type`]: "error",
      [`${namespace}/no-for`]: "error",
      [`${namespace}/no-json-parse`]: "error",
      [`${namespace}/no-null`]: "error",
      [`${namespace}/no-nullish-coalescing`]: "error",
      [`${namespace}/no-node-child-process`]: "error",
      [`${namespace}/no-optional-chaining`]: "error",
      [`${namespace}/no-promise`]: "error",
      [`${namespace}/no-process-env`]: "error",
      [`${namespace}/no-switch`]: "error",
      [`${namespace}/no-throw`]: "error",
      [`${namespace}/no-type-assertion`]: "error",
      [`${namespace}/no-try`]: "error",
      [`${namespace}/no-undefined`]: "error",
    },
  },
];

const recommendedTypeChecked = [
  {
    name: "enforce-effect/recommended-type-checked",
    plugins: {
      [namespace]: plugin,
    },
    rules: {},
  },
];

const accountability = [
  {
    name: "enforce-effect/accountability",
    plugins: {
      [namespace]: plugin,
    },
    rules: Object.fromEntries(
      Object.keys(accountabilityRules).map((ruleName) => [
        `${namespace}/${ruleName}`,
        "error",
      ]),
    ),
  },
];

const catenarycloudCore = configFromRuleNames(
  "enforce-effect/catenarycloud-core",
  catenarycloudCoreRuleNames,
  ["warn-effect-sync-wrapper"],
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
  ["warn-effect-sync-wrapper"],
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
