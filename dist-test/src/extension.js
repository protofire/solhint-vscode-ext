"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = __importStar(require("vscode"));
const config_1 = require("./config");
const diagnostics_1 = require("./diagnostics");
const solhintRunner_1 = require("./solhintRunner");
let outputChannel;
let diagnosticCollection;
function isSolidityDocument(document) {
    return document.languageId === "solidity" || document.fileName.toLowerCase().endsWith(".sol");
}
function trace(message) {
    const settings = (0, config_1.getSettings)();
    if (settings.trace) {
        outputChannel?.appendLine(`[solhint-vscode-ext] ${message}`);
    }
}
function lintDocument(document) {
    const settings = (0, config_1.getSettings)();
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
        const problems = (0, solhintRunner_1.runSolhint)(document, outputChannel);
        const diagnostics = (0, diagnostics_1.toDiagnostics)(problems);
        diagnosticCollection?.set(document.uri, diagnostics);
    }
    catch (error) {
        diagnosticCollection?.delete(document.uri);
        const message = error instanceof Error ? error.message : "Unknown Solhint execution error";
        outputChannel?.appendLine(`[solhint-vscode-ext] error: ${message}`);
        vscode.window.showWarningMessage(`Solhint VSCode Ext: ${message}`);
    }
}
function activate(context) {
    outputChannel = vscode.window.createOutputChannel("Solhint VSCode Ext");
    diagnosticCollection = vscode.languages.createDiagnosticCollection("solhint-vscode-ext");
    context.subscriptions.push(outputChannel);
    context.subscriptions.push(diagnosticCollection);
    const settings = (0, config_1.getSettings)();
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && settings.runOnOpen) {
        lintDocument(activeEditor.document);
    }
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (!editor) {
            return;
        }
        if (settings.runOnOpen) {
            lintDocument(editor.document);
        }
    }));
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((document) => {
        const settings = (0, config_1.getSettings)();
        if (!settings.runOnSave || !isSolidityDocument(document)) {
            return;
        }
        lintDocument(document);
    }));
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument((document) => {
        diagnosticCollection?.delete(document.uri);
    }));
}
