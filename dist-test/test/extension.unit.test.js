"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const moduleMocks_1 = require("./support/moduleMocks");
function createVsCodeMocks() {
    const activeEditor = { document: { languageId: "solidity", fileName: "A.sol", uri: { fsPath: "/w/A.sol" } } };
    const outputLines = [];
    const setCalls = [];
    const deleted = [];
    let onActiveEditorChange;
    let onSave;
    let onClose;
    const mock = {
        window: {
            activeTextEditor: activeEditor,
            createOutputChannel: () => ({ appendLine: (line) => outputLines.push(line) }),
            onDidChangeActiveTextEditor: (cb) => {
                onActiveEditorChange = cb;
                return { dispose: () => undefined };
            },
            showWarningMessage: (_message) => undefined,
        },
        languages: {
            createDiagnosticCollection: () => ({
                set: (uri, diagnostics) => setCalls.push({ uri, diagnostics }),
                delete: (uri) => deleted.push(uri),
            }),
        },
        workspace: {
            onDidSaveTextDocument: (cb) => {
                onSave = cb;
                return { dispose: () => undefined };
            },
            onDidCloseTextDocument: (cb) => {
                onClose = cb;
                return { dispose: () => undefined };
            },
        },
    };
    return { mock, activeEditor, outputLines, setCalls, deleted, handlers: { get onActiveEditorChange() { return onActiveEditorChange; }, get onSave() { return onSave; }, get onClose() { return onClose; } } };
}
(0, node_test_1.default)("Given runOnOpen enabled and valid solidity file, when extension activates, then it should lint and set diagnostics", () => {
    // Given
    const vscodeState = createVsCodeMocks();
    const subscriptions = [];
    const mocks = {
        vscode: vscodeState.mock,
        "./config": { getSettings: () => ({ enable: true, runOnOpen: true, runOnSave: true, pluginPaths: [], solhintModule: "solhint", trace: true }) },
        "./solhintRunner": { runSolhint: () => [{ ruleId: "r", message: "m", line: 1, column: 1, severity: 2 }] },
        "./diagnostics": { toDiagnostics: () => [{ id: "d1" }] },
    };
    // When
    (0, moduleMocks_1.withPatchedModuleLoader)(mocks, () => {
        const module = (0, moduleMocks_1.importFresh)("../src/extension");
        module.activate({ subscriptions });
    });
    // Then / Should
    strict_1.default.ok(subscriptions.length >= 4);
    strict_1.default.equal(vscodeState.setCalls.length, 1);
    strict_1.default.equal(vscodeState.outputLines.length > 0, true);
});
(0, node_test_1.default)("Given runOnSave enabled but a non-solidity document, when save callback fires, then it should not lint", () => {
    // Given
    const vscodeState = createVsCodeMocks();
    const subscriptions = [];
    let runSolhintCalls = 0;
    const mocks = {
        vscode: vscodeState.mock,
        "./config": { getSettings: () => ({ enable: true, runOnOpen: false, runOnSave: true, pluginPaths: [], solhintModule: "solhint", trace: false }) },
        "./solhintRunner": { runSolhint: () => { runSolhintCalls += 1; return []; } },
        "./diagnostics": { toDiagnostics: () => [] },
    };
    // When
    (0, moduleMocks_1.withPatchedModuleLoader)(mocks, () => {
        const module = (0, moduleMocks_1.importFresh)("../src/extension");
        module.activate({ subscriptions });
    });
    vscodeState.handlers.onSave?.({ languageId: "javascript", fileName: "index.js", uri: { fsPath: "/w/index.js" } });
    // Then / Should
    strict_1.default.equal(runSolhintCalls, 0);
});
(0, node_test_1.default)("Given runSolhint throws, when linting is triggered, then it should delete diagnostics and show warning", () => {
    // Given
    const vscodeState = createVsCodeMocks();
    const warnings = [];
    vscodeState.mock.window.showWarningMessage = (message) => {
        warnings.push(message);
        return undefined;
    };
    const mocks = {
        vscode: vscodeState.mock,
        "./config": { getSettings: () => ({ enable: true, runOnOpen: true, runOnSave: true, pluginPaths: [], solhintModule: "solhint", trace: false }) },
        "./solhintRunner": { runSolhint: () => { throw new Error("boom"); } },
        "./diagnostics": { toDiagnostics: () => [] },
    };
    // When
    (0, moduleMocks_1.withPatchedModuleLoader)(mocks, () => {
        const module = (0, moduleMocks_1.importFresh)("../src/extension");
        module.activate({ subscriptions: [] });
    });
    // Then / Should
    strict_1.default.equal(vscodeState.deleted.length, 1);
    strict_1.default.equal(warnings.length, 1);
    strict_1.default.match(warnings[0], /boom/);
});
(0, node_test_1.default)("Given close document event, when close callback fires, then it should delete diagnostics for that uri", () => {
    // Given
    const vscodeState = createVsCodeMocks();
    const mocks = {
        vscode: vscodeState.mock,
        "./config": { getSettings: () => ({ enable: true, runOnOpen: false, runOnSave: false, pluginPaths: [], solhintModule: "solhint", trace: false }) },
        "./solhintRunner": { runSolhint: () => [] },
        "./diagnostics": { toDiagnostics: () => [] },
    };
    // When
    (0, moduleMocks_1.withPatchedModuleLoader)(mocks, () => {
        const module = (0, moduleMocks_1.importFresh)("../src/extension");
        module.activate({ subscriptions: [] });
    });
    const closedUri = { fsPath: "/w/Closed.sol" };
    vscodeState.handlers.onClose?.({ languageId: "solidity", fileName: "Closed.sol", uri: closedUri });
    // Then / Should
    strict_1.default.equal(vscodeState.deleted.includes(closedUri), true);
});
