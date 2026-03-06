import * as vscode from "vscode";
import { SolhintProblem } from "./types";

function toSeverity(severity: number): vscode.DiagnosticSeverity {
  if (severity === 2) {
    return vscode.DiagnosticSeverity.Error;
  }

  if (severity === 3) {
    return vscode.DiagnosticSeverity.Warning;
  }

  return vscode.DiagnosticSeverity.Information;
}

export function toDiagnostics(problems: SolhintProblem[]): vscode.Diagnostic[] {
  return problems.map((problem) => {
    const line = Math.max(0, (problem.line || 1) - 1);
    const column = Math.max(0, (problem.column || 1) - 1);

    const range = new vscode.Range(line, column, line, column + 1);
    const diagnostic = new vscode.Diagnostic(
      range,
      problem.message,
      toSeverity(problem.severity)
    );

    diagnostic.source = "Solhint";
    diagnostic.code = problem.ruleId;

    return diagnostic;
  });
}