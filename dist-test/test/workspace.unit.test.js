"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const node_path_1 = __importDefault(require("node:path"));
const moduleMocks_1 = require("./support/moduleMocks");
(0, node_test_1.default)("Given relative and absolute plugin entries, when normalizing paths, then it should resolve only relative entries", () => {
    // Given
    const workspaceRoot = "/repo/contracts";
    const module = (0, moduleMocks_1.withPatchedModuleLoader)({ vscode: { workspace: {} } }, () => (0, moduleMocks_1.importFresh)("../src/workspace"));
    // When
    const normalized = module.normalizePluginPaths(workspaceRoot, ["./plugins/custom", "/opt/shared/plugin"]);
    // Then / Should
    strict_1.default.deepEqual(normalized, [
        node_path_1.default.resolve(workspaceRoot, "./plugins/custom"),
        "/opt/shared/plugin",
    ]);
});
(0, node_test_1.default)("Given an empty plugins list, when normalizing plugin paths, then it should return an empty list", () => {
    // Given
    const module = (0, moduleMocks_1.withPatchedModuleLoader)({ vscode: { workspace: {} } }, () => (0, moduleMocks_1.importFresh)("../src/workspace"));
    // When
    const normalized = module.normalizePluginPaths("/repo", []);
    // Then / Should
    strict_1.default.deepEqual(normalized, []);
});
(0, node_test_1.default)("Given a document in a workspace folder, when getting workspace root, then it should return folder fsPath", () => {
    // Given
    const expectedRoot = "/workspace/solhint-vscode-ext";
    const vscodeMock = {
        workspace: {
            getWorkspaceFolder: () => ({ uri: { fsPath: expectedRoot } }),
        },
    };
    // When
    const root = (0, moduleMocks_1.withPatchedModuleLoader)({ vscode: vscodeMock }, () => {
        const module = (0, moduleMocks_1.importFresh)("../src/workspace");
        return module.getWorkspaceRoot({ uri: { fsPath: `${expectedRoot}/contracts/Token.sol` } });
    });
    // Then / Should
    strict_1.default.equal(root, expectedRoot);
});
(0, node_test_1.default)("Given a document outside all folders, when getting workspace root, then it should return undefined", () => {
    // Given
    const vscodeMock = {
        workspace: {
            getWorkspaceFolder: () => undefined,
        },
    };
    // When
    const root = (0, moduleMocks_1.withPatchedModuleLoader)({ vscode: vscodeMock }, () => {
        const module = (0, moduleMocks_1.importFresh)("../src/workspace");
        return module.getWorkspaceRoot({ uri: { fsPath: "/tmp/Scratch.sol" } });
    });
    // Then / Should
    strict_1.default.equal(root, undefined);
});
