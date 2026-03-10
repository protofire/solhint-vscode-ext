"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const moduleMocks_1 = require("./support/moduleMocks");
function createWorkspaceWithModule(moduleBody, configBody) {
    const workspaceRoot = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), "solhint-runner-tests-"));
    const moduleDir = node_path_1.default.join(workspaceRoot, "node_modules", "fake-solhint");
    node_fs_1.default.mkdirSync(moduleDir, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(moduleDir, "index.js"), moduleBody);
    if (configBody) {
        node_fs_1.default.writeFileSync(node_path_1.default.join(workspaceRoot, ".solhint.json"), configBody);
    }
    return workspaceRoot;
}
(0, node_test_1.default)("Given no workspace root, when runSolhint is called, then it should return an empty array", () => {
    // Given
    const mocks = {
        vscode: {},
        "./config": { getSettings: () => ({ enable: true, runOnOpen: true, runOnSave: true, pluginPaths: [], solhintModule: "fake-solhint", trace: false }) },
        "./workspace": {
            getWorkspaceRoot: () => undefined,
            normalizePluginPaths: (_root, list) => list,
        },
    };
    // When
    const result = (0, moduleMocks_1.withPatchedModuleLoader)(mocks, () => {
        const module = (0, moduleMocks_1.importFresh)("../src/solhintRunner");
        return module.runSolhint({});
    });
    // Then / Should
    strict_1.default.deepEqual(result, []);
});
(0, node_test_1.default)("Given linter.processStr returns array, when runSolhint executes, then it should return that array and restore cwd", () => {
    // Given
    const workspaceRoot = createWorkspaceWithModule("module.exports={linter:{processStr:(code,config,file)=>[{ruleId:'a',message:code,line:1,column:1,severity:2,file,pluginPaths:config.pluginPaths}]}}", '{"extends":"solhint:recommended"}');
    const pluginPath = "./plugins/local";
    const output = [];
    const mocks = {
        vscode: {},
        "./config": { getSettings: () => ({ enable: true, runOnOpen: true, runOnSave: true, pluginPaths: [pluginPath], solhintModule: "fake-solhint", trace: true }) },
        "./workspace": {
            getWorkspaceRoot: () => workspaceRoot,
            normalizePluginPaths: (_root) => [node_path_1.default.join(workspaceRoot, "plugins", "local")],
        },
    };
    const cwdBefore = process.cwd();
    // When
    const result = (0, moduleMocks_1.withPatchedModuleLoader)(mocks, () => {
        const module = (0, moduleMocks_1.importFresh)("../src/solhintRunner");
        return module.runSolhint({ uri: { fsPath: node_path_1.default.join(workspaceRoot, "A.sol") }, getText: () => "pragma solidity ^0.8.0;" }, { appendLine: (line) => output.push(line) });
    });
    // Then / Should
    strict_1.default.equal(process.cwd(), cwdBefore);
    strict_1.default.equal(result.length, 1);
    strict_1.default.equal(result[0].message, "pragma solidity ^0.8.0;");
    strict_1.default.ok(output.some((line) => line.includes("solhint resolved")));
    strict_1.default.ok(output.some((line) => line.includes("pluginPaths")));
});
(0, node_test_1.default)("Given processStr returns reporter shape, when runSolhint executes, then it should return reports", () => {
    // Given
    const workspaceRoot = createWorkspaceWithModule("module.exports={processStr:()=>({reports:[{ruleId:'r',message:'ok',line:1,column:1,severity:3}]})}");
    const mocks = {
        vscode: {},
        "./config": { getSettings: () => ({ enable: true, runOnOpen: true, runOnSave: true, pluginPaths: [], solhintModule: "fake-solhint", trace: false }) },
        "./workspace": {
            getWorkspaceRoot: () => workspaceRoot,
            normalizePluginPaths: () => [],
        },
    };
    // When
    const result = (0, moduleMocks_1.withPatchedModuleLoader)(mocks, () => {
        const module = (0, moduleMocks_1.importFresh)("../src/solhintRunner");
        return module.runSolhint({ uri: { fsPath: node_path_1.default.join(workspaceRoot, "B.sol") }, getText: () => "" });
    });
    // Then / Should
    strict_1.default.equal(result.length, 1);
    strict_1.default.equal(result[0].ruleId, "r");
});
(0, node_test_1.default)("Given incompatible solhint API, when runSolhint executes, then it should throw a compatibility error", () => {
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
    strict_1.default.throws(() => (0, moduleMocks_1.withPatchedModuleLoader)(mocks, () => {
        const module = (0, moduleMocks_1.importFresh)("../src/solhintRunner");
        module.runSolhint({ uri: { fsPath: node_path_1.default.join(workspaceRoot, "C.sol") }, getText: () => "" });
    }), /Could not find a compatible Solhint API/);
});
(0, node_test_1.default)("Given unsupported result shape, when runSolhint executes, then it should throw unsupported shape error", () => {
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
    strict_1.default.throws(() => (0, moduleMocks_1.withPatchedModuleLoader)(mocks, () => {
        const module = (0, moduleMocks_1.importFresh)("../src/solhintRunner");
        module.runSolhint({ uri: { fsPath: node_path_1.default.join(workspaceRoot, "D.sol") }, getText: () => "" });
    }), /Unsupported Solhint result shape/);
});
