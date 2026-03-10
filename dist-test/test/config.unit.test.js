"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const moduleMocks_1 = require("./support/moduleMocks");
(0, node_test_1.default)("Given no user settings, when getSettings is called, then it should return defaults", () => {
    // Given
    const vscodeMock = {
        workspace: {
            getConfiguration: () => ({
                get: (_key, fallback) => fallback,
            }),
        },
    };
    // When
    const settings = (0, moduleMocks_1.withPatchedModuleLoader)({ vscode: vscodeMock }, () => {
        const configModule = (0, moduleMocks_1.importFresh)("../src/config");
        return configModule.getSettings();
    });
    // Then / Should
    strict_1.default.deepEqual(settings, {
        enable: true,
        runOnOpen: true,
        runOnSave: true,
        pluginPaths: [],
        solhintModule: "solhint",
        trace: false,
    });
});
(0, node_test_1.default)("Given custom settings values, when getSettings is called, then it should return configured values", () => {
    // Given
    const configured = {
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
                get: (key, fallback) => (key in configured ? configured[key] : fallback),
            }),
        },
    };
    // When
    const settings = (0, moduleMocks_1.withPatchedModuleLoader)({ vscode: vscodeMock }, () => {
        const configModule = (0, moduleMocks_1.importFresh)("../src/config");
        return configModule.getSettings();
    });
    // Then / Should
    strict_1.default.equal(settings.enable, false);
    strict_1.default.equal(settings.runOnOpen, false);
    strict_1.default.equal(settings.runOnSave, false);
    strict_1.default.deepEqual(settings.pluginPaths, ["./plugins/a", "/opt/plugins/b"]);
    strict_1.default.equal(settings.solhintModule, "custom-solhint");
    strict_1.default.equal(settings.trace, true);
});
