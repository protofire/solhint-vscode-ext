import test from "node:test";
import assert from "node:assert/strict";
import { importFresh, withPatchedModuleLoader } from "./support/moduleMocks";

type ConfigModule = typeof import("../src/config");

test("Given no user settings, when getSettings is called, then it should return defaults", () => {
  // Given
  const vscodeMock = {
    workspace: {
      getConfiguration: () => ({
        get: <T>(_key: string, fallback: T): T => fallback,
      }),
    },
  };

  // When
  const settings = withPatchedModuleLoader({ vscode: vscodeMock }, () => {
    const configModule = importFresh<ConfigModule>("../src/config");
    return configModule.getSettings();
  });

  // Then / Should
  assert.deepEqual(settings, {
    enable: true,
    runOnOpen: true,
    runOnSave: true,
    pluginPaths: [],
    solhintModule: "solhint",
    trace: false,
  });
});

test("Given custom settings values, when getSettings is called, then it should return configured values", () => {
  // Given
  const configured: Record<string, unknown> = {
    enable: false,
    runOnOpen: false,
    runOnSave: false,
    pluginPaths: ["./plugins/a", "/opt/plugins/b"],
    solhintModule: "custom-solhint",
    trace: true,
  };

  const vscodeMock = {
    workspace: {
      getConfiguration: () => ({
        get: <T>(key: string, fallback: T): T => (key in configured ? (configured[key] as T) : fallback),
      }),
    },
  };

  // When
  const settings = withPatchedModuleLoader({ vscode: vscodeMock }, () => {
    const configModule = importFresh<ConfigModule>("../src/config");
    return configModule.getSettings();
  });

  // Then / Should
  assert.equal(settings.enable, false);
  assert.equal(settings.runOnOpen, false);
  assert.equal(settings.runOnSave, false);
  assert.deepEqual(settings.pluginPaths, ["./plugins/a", "/opt/plugins/b"]);
  assert.equal(settings.solhintModule, "custom-solhint");
  assert.equal(settings.trace, true);
});
