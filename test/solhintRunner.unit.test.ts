import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { importFresh, withPatchedModuleLoader } from "./support/moduleMocks";

type RunnerModule = typeof import("../src/solhintRunner");

function createWorkspaceWithModule(moduleBody: string, configBody?: string): string {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "solhint-runner-tests-"));
  const moduleDir = path.join(workspaceRoot, "node_modules", "fake-solhint");
  fs.mkdirSync(moduleDir, { recursive: true });
  fs.writeFileSync(path.join(moduleDir, "index.js"), moduleBody);

  if (configBody) {
    fs.writeFileSync(path.join(workspaceRoot, ".solhint.json"), configBody);
  }

  return workspaceRoot;
}

test("Given no workspace root, when runSolhint is called, then it should return an empty array", () => {
  // Given
  const mocks = {
    vscode: {},
    "./config": { getSettings: () => ({ enable: true, runOnOpen: true, runOnSave: true, pluginPaths: [], solhintModule: "fake-solhint", trace: false }) },
    "./workspace": {
      getWorkspaceRoot: () => undefined,
      normalizePluginPaths: (_root: string, list: string[]) => list,
    },
  };

  // When
  const result = withPatchedModuleLoader(mocks, () => {
    const module = importFresh<RunnerModule>("../src/solhintRunner");
    return module.runSolhint({} as never);
  });

  // Then / Should
  assert.deepEqual(result, []);
});

test("Given linter.processStr returns array, when runSolhint executes, then it should return that array and restore cwd", () => {
  // Given
  const workspaceRoot = createWorkspaceWithModule(
    "module.exports={linter:{processStr:(code,config,file)=>[{ruleId:'a',message:code,line:1,column:1,severity:2,file,pluginPaths:config.pluginPaths}]}}",
    '{"extends":"solhint:recommended"}',
  );

  const pluginPath = "./plugins/local";
  const output: string[] = [];

  const mocks = {
    vscode: {},
    "./config": { getSettings: () => ({ enable: true, runOnOpen: true, runOnSave: true, pluginPaths: [pluginPath], solhintModule: "fake-solhint", trace: true }) },
    "./workspace": {
      getWorkspaceRoot: () => workspaceRoot,
      normalizePluginPaths: (_root: string) => [path.join(workspaceRoot, "plugins", "local")],
    },
  };

  const cwdBefore = process.cwd();

  // When
  const result = withPatchedModuleLoader(mocks, () => {
    const module = importFresh<RunnerModule>("../src/solhintRunner");
    return module.runSolhint(
      { uri: { fsPath: path.join(workspaceRoot, "A.sol") }, getText: () => "pragma solidity ^0.8.0;" } as never,
      { appendLine: (line: string) => output.push(line) } as never,
    );
  });

  // Then / Should
  assert.equal(process.cwd(), cwdBefore);
  assert.equal(result.length, 1);
  assert.equal(result[0].message, "pragma solidity ^0.8.0;");
  assert.ok(output.some((line) => line.includes("solhint resolved")));
  assert.ok(output.some((line) => line.includes("pluginPaths")));
});

test("Given processStr returns reporter shape, when runSolhint executes, then it should return reports", () => {
  // Given
  const workspaceRoot = createWorkspaceWithModule(
    "module.exports={processStr:()=>({reports:[{ruleId:'r',message:'ok',line:1,column:1,severity:3}]})}",
  );

  const mocks = {
    vscode: {},
    "./config": { getSettings: () => ({ enable: true, runOnOpen: true, runOnSave: true, pluginPaths: [], solhintModule: "fake-solhint", trace: false }) },
    "./workspace": {
      getWorkspaceRoot: () => workspaceRoot,
      normalizePluginPaths: () => [],
    },
  };

  // When
  const result = withPatchedModuleLoader(mocks, () => {
    const module = importFresh<RunnerModule>("../src/solhintRunner");
    return module.runSolhint({ uri: { fsPath: path.join(workspaceRoot, "B.sol") }, getText: () => "" } as never);
  });

  // Then / Should
  assert.equal(result.length, 1);
  assert.equal(result[0].ruleId, "r");
});

test("Given incompatible solhint API, when runSolhint executes, then it should throw a compatibility error", () => {
  // Given
  const workspaceRoot = createWorkspaceWithModule("module.exports={}");
  const mocks = {
    vscode: {},
    "./config": { getSettings: () => ({ enable: true, runOnOpen: true, runOnSave: true, pluginPaths: [], solhintModule: "fake-solhint", trace: false }) },
    "./workspace": {
      getWorkspaceRoot: () => workspaceRoot,
      normalizePluginPaths: () => [],
    },
  };

  // When / Then / Should
  assert.throws(
    () =>
      withPatchedModuleLoader(mocks, () => {
        const module = importFresh<RunnerModule>("../src/solhintRunner");
        module.runSolhint({ uri: { fsPath: path.join(workspaceRoot, "C.sol") }, getText: () => "" } as never);
      }),
    /Could not find a compatible Solhint API/,
  );
});

test("Given unsupported result shape, when runSolhint executes, then it should throw unsupported shape error", () => {
  // Given
  const workspaceRoot = createWorkspaceWithModule("module.exports={processStr:()=>({hello:'world'})}");
  const mocks = {
    vscode: {},
    "./config": { getSettings: () => ({ enable: true, runOnOpen: true, runOnSave: true, pluginPaths: [], solhintModule: "fake-solhint", trace: false }) },
    "./workspace": {
      getWorkspaceRoot: () => workspaceRoot,
      normalizePluginPaths: () => [],
    },
  };

  // When / Then / Should
  assert.throws(
    () =>
      withPatchedModuleLoader(mocks, () => {
        const module = importFresh<RunnerModule>("../src/solhintRunner");
        module.runSolhint({ uri: { fsPath: path.join(workspaceRoot, "D.sol") }, getText: () => "" } as never);
      }),
    /Unsupported Solhint result shape/,
  );
});
