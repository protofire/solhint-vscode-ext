import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { importFresh, withPatchedModuleLoader } from "./support/moduleMocks";

type WorkspaceModule = typeof import("../src/workspace");

test("Given relative and absolute plugin entries, when normalizing paths, then it should resolve only relative entries", () => {
  // Given
  const workspaceRoot = "/repo/contracts";

  const module = withPatchedModuleLoader({ vscode: { workspace: {} } }, () =>
    importFresh<WorkspaceModule>("../src/workspace"),
  );

  // When
  const normalized = module.normalizePluginPaths(workspaceRoot, ["./plugins/custom", "/opt/shared/plugin"]);

  // Then / Should
  assert.deepEqual(normalized, [
    path.resolve(workspaceRoot, "./plugins/custom"),
    "/opt/shared/plugin",
  ]);
});

test("Given an empty plugins list, when normalizing plugin paths, then it should return an empty list", () => {
  // Given
  const module = withPatchedModuleLoader({ vscode: { workspace: {} } }, () =>
    importFresh<WorkspaceModule>("../src/workspace"),
  );

  // When
  const normalized = module.normalizePluginPaths("/repo", []);

  // Then / Should
  assert.deepEqual(normalized, []);
});

test("Given a document in a workspace folder, when getting workspace root, then it should return folder fsPath", () => {
  // Given
  const expectedRoot = "/workspace/solhint-vscode-ext";
  const vscodeMock = {
    workspace: {
      getWorkspaceFolder: () => ({ uri: { fsPath: expectedRoot } }),
    },
  };

  // When
  const root = withPatchedModuleLoader({ vscode: vscodeMock }, () => {
    const module = importFresh<WorkspaceModule>("../src/workspace");
    return module.getWorkspaceRoot({ uri: { fsPath: `${expectedRoot}/contracts/Token.sol` } } as never);
  });

  // Then / Should
  assert.equal(root, expectedRoot);
});

test("Given a document outside all folders, when getting workspace root, then it should return undefined", () => {
  // Given
  const vscodeMock = {
    workspace: {
      getWorkspaceFolder: () => undefined,
    },
  };

  // When
  const root = withPatchedModuleLoader({ vscode: vscodeMock }, () => {
    const module = importFresh<WorkspaceModule>("../src/workspace");
    return module.getWorkspaceRoot({ uri: { fsPath: "/tmp/Scratch.sol" } } as never);
  });

  // Then / Should
  assert.equal(root, undefined);
});
