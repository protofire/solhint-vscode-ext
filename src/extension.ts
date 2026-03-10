import * as vscode from "vscode";
import { getSettings } from "./config";
import { toDiagnostics } from "./diagnostics";
import { runSolhint } from "./solhintRunner";

let outputChannel: vscode.OutputChannel | undefined;
let diagnosticCollection: vscode.DiagnosticCollection | undefined;

function isSolidityDocument(document: vscode.TextDocument): boolean {
  return document.languageId === "solidity" || document.fileName.toLowerCase().endsWith(".sol");
}

function trace(message: string): void {
  const settings = getSettings();

  if (settings.trace) {
    outputChannel?.appendLine(`[solhint-vscode-ext] ${message}`);
  }
}

function lintDocument(document: vscode.TextDocument): void {
  const settings = getSettings();

  if (!settings.enable) {
    diagnosticCollection?.delete(document.uri);
    return;
  }

  if (!isSolidityDocument(document)) {
    diagnosticCollection?.delete(document.uri);
    return;
  }

  try {
    trace(`linting: ${document.uri.fsPath}`);

    const problems = runSolhint(document, outputChannel);
    const diagnostics = toDiagnostics(problems);

    diagnosticCollection?.set(document.uri, diagnostics);
  } catch (error) {
    diagnosticCollection?.delete(document.uri);

    const message = error instanceof Error ? error.message : "Unknown Solhint execution error";

    outputChannel?.appendLine(`[solhint-vscode-ext] error: ${message}`);
    vscode.window.showWarningMessage(`Solhint VSCode Ext: ${message}`);
  }
}

export function activate(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel("Solhint VSCode Ext");
  diagnosticCollection = vscode.languages.createDiagnosticCollection("solhint-vscode-ext");

  context.subscriptions.push(outputChannel);
  context.subscriptions.push(diagnosticCollection);

  const settings = getSettings();

  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor && settings.runOnOpen) {
    lintDocument(activeEditor.document);
  }

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (!editor) {
        return;
      }

      if (settings.runOnOpen) {
        lintDocument(editor.document);
      }
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      const settings = getSettings();

      if (!settings.runOnSave || !isSolidityDocument(document)) {
        return;
      }

      lintDocument(document);
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((document) => {
      diagnosticCollection?.delete(document.uri);
    }),
  );
}
