import test from "node:test";
import assert from "node:assert/strict";
import { importFresh, withPatchedModuleLoader } from "./support/moduleMocks";

type ExtensionModule = typeof import("../src/extension");

function createVsCodeMocks() {
  const activeEditor = { document: { languageId: "solidity", fileName: "A.sol", uri: { fsPath: "/w/A.sol" } } };
  const outputLines: string[] = [];
  const setCalls: Array<{ uri: unknown; diagnostics: unknown[] }> = [];
  const deleted: unknown[] = [];

  let onActiveEditorChange: ((editor: typeof activeEditor | undefined) => void) | undefined;
  let onSave: ((document: typeof activeEditor.document) => void) | undefined;
  let onClose: ((document: typeof activeEditor.document) => void) | undefined;

  const mock = {
    window: {
      activeTextEditor: activeEditor,
      createOutputChannel: () => ({ appendLine: (line: string) => outputLines.push(line) }),
      onDidChangeActiveTextEditor: (cb: typeof onActiveEditorChange) => {
        onActiveEditorChange = cb;
        return { dispose: () => undefined };
      },
      showWarningMessage: (_message: string) => undefined,
    },
    languages: {
      createDiagnosticCollection: () => ({
        set: (uri: unknown, diagnostics: unknown[]) => setCalls.push({ uri, diagnostics }),
        delete: (uri: unknown) => deleted.push(uri),
      }),
    },
    workspace: {
      onDidSaveTextDocument: (cb: typeof onSave) => {
        onSave = cb;
        return { dispose: () => undefined };
      },
      onDidCloseTextDocument: (cb: typeof onClose) => {
        onClose = cb;
        return { dispose: () => undefined };
      },
    },
  };

  return { mock, activeEditor, outputLines, setCalls, deleted, handlers: { get onActiveEditorChange() { return onActiveEditorChange; }, get onSave() { return onSave; }, get onClose() { return onClose; } } };
}

test("Given runOnOpen enabled and valid solidity file, when extension activates, then it should lint and set diagnostics", () => {
  // Given
  const vscodeState = createVsCodeMocks();
  const subscriptions: unknown[] = [];

  const mocks = {
    vscode: vscodeState.mock,
    "./config": { getSettings: () => ({ enable: true, runOnOpen: true, runOnSave: true, pluginPaths: [], solhintModule: "solhint", trace: true }) },
    "./solhintRunner": { runSolhint: () => [{ ruleId: "r", message: "m", line: 1, column: 1, severity: 2 }] },
    "./diagnostics": { toDiagnostics: () => [{ id: "d1" }] },
  };

  // When
  withPatchedModuleLoader(mocks, () => {
    const module = importFresh<ExtensionModule>("../src/extension");
    module.activate({ subscriptions } as never);
  });

  // Then / Should
  assert.ok(subscriptions.length >= 4);
  assert.equal(vscodeState.setCalls.length, 1);
  assert.equal(vscodeState.outputLines.length > 0, true);
});

test("Given runOnSave enabled but a non-solidity document, when save callback fires, then it should not lint", () => {
  // Given
  const vscodeState = createVsCodeMocks();
  const subscriptions: unknown[] = [];
  let runSolhintCalls = 0;

  const mocks = {
    vscode: vscodeState.mock,
    "./config": { getSettings: () => ({ enable: true, runOnOpen: false, runOnSave: true, pluginPaths: [], solhintModule: "solhint", trace: false }) },
    "./solhintRunner": { runSolhint: () => { runSolhintCalls += 1; return []; } },
    "./diagnostics": { toDiagnostics: () => [] },
  };

  // When
  withPatchedModuleLoader(mocks, () => {
    const module = importFresh<ExtensionModule>("../src/extension");
    module.activate({ subscriptions } as never);
  });

  vscodeState.handlers.onSave?.({ languageId: "javascript", fileName: "index.js", uri: { fsPath: "/w/index.js" } });

  // Then / Should
  assert.equal(runSolhintCalls, 0);
});

test("Given runSolhint throws, when linting is triggered, then it should delete diagnostics and show warning", () => {
  // Given
  const vscodeState = createVsCodeMocks();
  const warnings: string[] = [];
  vscodeState.mock.window.showWarningMessage = (message: string) => {
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
  withPatchedModuleLoader(mocks, () => {
    const module = importFresh<ExtensionModule>("../src/extension");
    module.activate({ subscriptions: [] } as never);
  });

  // Then / Should
  assert.equal(vscodeState.deleted.length, 1);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /boom/);
});

test("Given close document event, when close callback fires, then it should delete diagnostics for that uri", () => {
  // Given
  const vscodeState = createVsCodeMocks();

  const mocks = {
    vscode: vscodeState.mock,
    "./config": { getSettings: () => ({ enable: true, runOnOpen: false, runOnSave: false, pluginPaths: [], solhintModule: "solhint", trace: false }) },
    "./solhintRunner": { runSolhint: () => [] },
    "./diagnostics": { toDiagnostics: () => [] },
  };

  // When
  withPatchedModuleLoader(mocks, () => {
    const module = importFresh<ExtensionModule>("../src/extension");
    module.activate({ subscriptions: [] } as never);
  });

  const closedUri = { fsPath: "/w/Closed.sol" };
  vscodeState.handlers.onClose?.({ languageId: "solidity", fileName: "Closed.sol", uri: closedUri });

  // Then / Should
  assert.equal(vscodeState.deleted.includes(closedUri), true);
});
