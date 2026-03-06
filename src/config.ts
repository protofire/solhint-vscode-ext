import * as vscode from "vscode";

export interface ExtensionSettings {
  enable: boolean;
  runOnOpen: boolean;
  runOnSave: boolean;
  pluginPaths: string[];
  solhintModule: string;
  trace: boolean;
}

const SECTION = "solhintVscodeExt";

export function getSettings(): ExtensionSettings {
  const config = vscode.workspace.getConfiguration(SECTION);

  return {
    enable: config.get<boolean>("enable", true),
    runOnOpen: config.get<boolean>("runOnOpen", true),
    runOnSave: config.get<boolean>("runOnSave", true),
    pluginPaths: config.get<string[]>("pluginPaths", []),
    solhintModule: config.get<string>("solhintModule", "solhint"),
    trace: config.get<boolean>("trace", false)
  };
}