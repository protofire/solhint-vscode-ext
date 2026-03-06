import * as path from "path";
import * as vscode from "vscode";

export function getWorkspaceRoot(document: vscode.TextDocument): string | undefined {
  const folder = vscode.workspace.getWorkspaceFolder(document.uri);
  return folder?.uri.fsPath;
}

export function normalizePluginPaths(
  workspaceRoot: string,
  pluginPaths: string[]
): string[] {
  return pluginPaths.map((entry) =>
    path.isAbsolute(entry) ? entry : path.resolve(workspaceRoot, entry)
  );
}