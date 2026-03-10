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
exports.runSolhint = runSolhint;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = require("./config");
const workspace_1 = require("./workspace");
function readSolhintConfig(workspaceRoot) {
    const configPath = path.join(workspaceRoot, ".solhint.json");
    if (!fs.existsSync(configPath)) {
        return {};
    }
    const raw = fs.readFileSync(configPath, "utf8");
    return JSON.parse(raw);
}
function resolveSolhintModule(resolutionPaths, moduleName) {
    return require.resolve(moduleName, {
        paths: resolutionPaths,
    });
}
function isReporterShape(value) {
    return Boolean(value && typeof value === "object" && Array.isArray(value.reports));
}
function runSolhint(document, outputChannel) {
    const workspaceRoot = (0, workspace_1.getWorkspaceRoot)(document);
    if (!workspaceRoot) {
        return [];
    }
    const settings = (0, config_1.getSettings)();
    const pluginPaths = (0, workspace_1.normalizePluginPaths)(workspaceRoot, settings.pluginPaths);
    const resolutionPaths = [workspaceRoot, path.join(workspaceRoot, "node_modules"), ...pluginPaths];
    let rawResult;
    const previousCwd = process.cwd();
    try {
        process.chdir(workspaceRoot);
        const solhintPath = resolveSolhintModule(resolutionPaths, settings.solhintModule);
        const solhintModule = require(solhintPath);
        const config = readSolhintConfig(workspaceRoot);
        if (pluginPaths.length > 0) {
            config.pluginPaths = pluginPaths;
        }
        if (settings.trace) {
            outputChannel?.appendLine(`[solhint-vscode-ext] solhint resolved: ${solhintPath}`);
            outputChannel?.appendLine(`[solhint-vscode-ext] lint file: ${document.uri.fsPath}`);
            outputChannel?.appendLine(`[solhint-vscode-ext] pluginPaths: ${JSON.stringify(pluginPaths)}`);
        }
        const code = document.getText();
        const fileName = document.uri.fsPath;
        if (solhintModule.linter?.processStr) {
            rawResult = solhintModule.linter.processStr(code, config, fileName);
        }
        else if (solhintModule.processStr) {
            rawResult = solhintModule.processStr(code, config, fileName);
        }
        else {
            throw new Error("Could not find a compatible Solhint API.");
        }
    }
    finally {
        process.chdir(previousCwd);
    }
    if (Array.isArray(rawResult)) {
        return rawResult;
    }
    if (isReporterShape(rawResult)) {
        return rawResult.reports;
    }
    throw new Error("Unsupported Solhint result shape.");
}
