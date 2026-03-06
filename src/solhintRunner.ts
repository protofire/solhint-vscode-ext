import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { getSettings } from "./config";
import { SolhintProblem, SolhintModuleShape } from "./types";
import { getWorkspaceRoot, normalizePluginPaths } from "./workspace";

interface SolhintReporterShape {
  reports: SolhintProblem[];
  file?: string;
}

function readSolhintConfig(workspaceRoot: string): Record<string, unknown> {
  const configPath = path.join(workspaceRoot, ".solhint.json");

  if (!fs.existsSync(configPath)) {
    return {};
  }

  const raw = fs.readFileSync(configPath, "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

function resolveSolhintModule(resolutionPaths: string[], moduleName: string): string {
  return require.resolve(moduleName, {
    paths: resolutionPaths
  });
}

function isReporterShape(value: unknown): value is SolhintReporterShape {
  return Boolean(
    value &&
      typeof value === "object" &&
      Array.isArray((value as SolhintReporterShape).reports)
  );
}

function addPluginResolutionPaths(pathsToAdd: string[]): void {
  const nodeModulePaths = (module as NodeModule).paths;

  for (const pluginPath of pathsToAdd) {
    if (!nodeModulePaths.includes(pluginPath)) {
      nodeModulePaths.unshift(pluginPath);
    }
  }
}

export function runSolhint(
  document: vscode.TextDocument,
  outputChannel?: vscode.OutputChannel
): SolhintProblem[] {
  const workspaceRoot = getWorkspaceRoot(document);

  if (!workspaceRoot) {
    return [];
  }

  const settings = getSettings();
  const pluginPaths = normalizePluginPaths(workspaceRoot, settings.pluginPaths);
  const resolutionPaths = [
    workspaceRoot,
    path.join(workspaceRoot, "node_modules"),
    ...pluginPaths
  ];

  let rawResult: unknown;
  const previousCwd = process.cwd();

  try {
    process.chdir(workspaceRoot);

    addPluginResolutionPaths(pluginPaths);

    const solhintPath = resolveSolhintModule(
      resolutionPaths,
      settings.solhintModule
    );
    const solhintModule = require(solhintPath) as SolhintModuleShape;
    const config = readSolhintConfig(workspaceRoot);

    if (settings.trace) {
      outputChannel?.appendLine(`[solhint-vscode-ext] workspaceRoot: ${workspaceRoot}`);
      outputChannel?.appendLine(`[solhint-vscode-ext] solhint resolved: ${solhintPath}`);
      outputChannel?.appendLine(`[solhint-vscode-ext] lint file: ${document.uri.fsPath}`);
      outputChannel?.appendLine(`[solhint-vscode-ext] pluginPaths: ${JSON.stringify(pluginPaths)}`);
      outputChannel?.appendLine(`[solhint-vscode-ext] resolutionPaths: ${JSON.stringify(resolutionPaths)}`);
      outputChannel?.appendLine(`[solhint-vscode-ext] cwd before lint: ${previousCwd}`);
      outputChannel?.appendLine(`[solhint-vscode-ext] cwd target: ${workspaceRoot}`);
    }

    const code = document.getText();
    const fileName = document.uri.fsPath;

    if (solhintModule.linter?.processStr) {
      rawResult = solhintModule.linter.processStr(code, config, fileName);
    } else if (solhintModule.processStr) {
      rawResult = solhintModule.processStr(code, config, fileName);
    } else {
      throw new Error("Could not find a compatible Solhint API.");
    }
  } finally {
    process.chdir(previousCwd);
  }

  if (Array.isArray(rawResult)) {
    return rawResult as SolhintProblem[];
  }

  if (isReporterShape(rawResult)) {
    return rawResult.reports;
  }

  throw new Error("Unsupported Solhint result shape.");
}