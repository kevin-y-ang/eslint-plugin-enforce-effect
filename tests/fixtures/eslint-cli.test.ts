import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../..");
const nodeExecutable = process.execPath;
const tscCli = path.join(repoRoot, "node_modules/typescript/bin/tsc");
const eslintCli = path.join(repoRoot, "node_modules/eslint/bin/eslint.js");
const fixtureConfig = path.join(repoRoot, "fixtures/eslint.config.mjs");
const validFixturesDir = path.join(repoRoot, "fixtures/valid");
const invalidFixturesDir = path.join(repoRoot, "fixtures/invalid");
const catenarycloudFixturesDir = path.join(
  repoRoot,
  "fixtures/invalid/catenarycloud",
);
const accountabilityFixturesDir = path.join(
  repoRoot,
  "fixtures/invalid/accountability",
);

const recommendedRuleNames = [
  "no-error",
  "no-explicit-function-return-type",
  "no-for",
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
];

const accountabilityRuleNames = [
  "no-disable-validation",
  "no-effect-asvoid",
  "no-effect-catchallcause",
  "no-effect-ignore",
  "no-localstorage",
  "no-location-href-redirect",
  "no-nested-layer-provide",
  "no-service-option",
  "no-silent-error-swallow",
  "no-sql-type-parameter",
  "pipe-max-arguments",
  "prefer-option-from-nullable",
];

const catenarycloudRuleNames = [
  "no-arrow-ladder",
  "no-branch-in-object",
  "no-call-tower",
  "no-effect-all-step-sequencing",
  "no-effect-as",
  "no-effect-async",
  "no-effect-bind",
  "no-effect-call-in-effect-arg",
  "no-effect-do",
  "no-effect-fn-generator",
  "no-effect-ladder",
  "no-effect-never",
  "no-effect-orElse-ladder",
  "no-effect-side-effect-wrapper",
  "no-effect-sync-console",
  "no-effect-type-alias",
  "no-effect-wrapper-alias",
  "no-flatmap-ladder",
  "no-fromnullable-nullish-coalesce",
  "no-if-statement",
  "no-iife-wrapper",
  "no-manual-effect-channels",
  "no-match-effect-branch",
  "no-match-void-branch",
  "no-model-overlay-cast",
  "no-nested-effect-call",
  "no-nested-effect-gen",
  "no-option-as",
  "no-option-boolean-normalization",
  "no-pipe-ladder",
  "no-return-in-arrow",
  "no-return-in-callback",
  "no-return-null",
  "no-runtime-runfork",
  "no-string-sentinel-const",
  "no-string-sentinel-return",
  "no-switch-statement",
  "no-ternary",
  "no-try-catch",
  "no-unknown-boolean-coercion-helper",
  "prevent-dynamic-imports",
  "warn-effect-sync-wrapper",
  "no-atom-registry-effect-sync",
  "no-inline-runtime-provide",
  "no-react-state",
  "no-render-side-effects",
  "no-wrapgraphql-catchall",
];

function runNodeScript(args: string[]) {
  const result = spawnSync(nodeExecutable, args, {
    cwd: repoRoot,
    encoding: "utf8",
  });

  return {
    status: result.status,
    output: `${result.stdout}${result.stderr}`,
  };
}

function runEslint(target: string) {
  return runNodeScript([eslintCli, "--config", fixtureConfig, target]);
}

beforeAll(() => {
  const buildResult = runNodeScript([tscCli, "-p", "tsconfig.build.json"]);

  expect(buildResult.status, buildResult.output).toBe(0);
});

describe("eslint cli fixtures", () => {
  it("accepts the valid fixture suite", { timeout: 20000 }, () => {
    const result = runEslint(validFixturesDir);

    expect(result.status, result.output).toBe(0);
    expect(result.output).toBe("");
  });

  it(
    "reports the expected violations for the recommended invalid fixtures",
    { timeout: 20000 },
    () => {
      const result = runEslint(invalidFixturesDir);

      expect(result.status).toBe(1);

      for (const ruleName of recommendedRuleNames) {
        expect(result.output, `expected enforce-effect/${ruleName}`).toContain(
          `enforce-effect/${ruleName}`,
        );
      }
    },
  );

  it(
    "reports the expected violations for the catenarycloud invalid fixtures",
    { timeout: 20000 },
    () => {
      const result = runEslint(catenarycloudFixturesDir);

      expect(result.status).toBe(1);

      for (const ruleName of catenarycloudRuleNames) {
        expect(result.output, `expected enforce-effect/${ruleName}`).toContain(
          `enforce-effect/${ruleName}`,
        );
      }
    },
  );

  it(
    "reports the expected violations for the accountability invalid fixtures",
    { timeout: 20000 },
    () => {
      const result = runEslint(accountabilityFixturesDir);

      expect(result.status).toBe(1);

      for (const ruleName of accountabilityRuleNames) {
        expect(result.output, `expected enforce-effect/${ruleName}`).toContain(
          `enforce-effect/${ruleName}`,
        );
      }
    },
  );
});
