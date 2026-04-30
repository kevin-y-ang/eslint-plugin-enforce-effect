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

const recommendedRuleNames = [
  "no-console",
  "no-crypto",
  "no-error",
  "no-explicit-function-return-type",
  "no-for",
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
});
