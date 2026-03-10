import test from "node:test";
import assert from "node:assert/strict";
import { importFresh, withPatchedModuleLoader } from "./support/moduleMocks";

type DiagnosticsModule = typeof import("../src/diagnostics");

test("Given problems with all severities, when converting to diagnostics, then it should map severities and metadata", () => {
  // Given
  const vscodeMock = {
    DiagnosticSeverity: { Error: 0, Warning: 1, Information: 2 },
    Range: class Range {
      constructor(public startLine: number, public startChar: number, public endLine: number, public endChar: number) {}
    },
    Diagnostic: class Diagnostic {
      public source?: string;
      public code?: string;

      constructor(public range: unknown, public message: string, public severity: number) {}
    },
  };

  const problems = [
    { ruleId: "err-rule", message: "Error", line: 2, column: 3, severity: 2 },
    { ruleId: "warn-rule", message: "Warning", line: 1, column: 1, severity: 3 },
    { ruleId: "info-rule", message: "Info", line: 0, column: 0, severity: 1 },
  ];

  // When
  const diagnostics = withPatchedModuleLoader({ vscode: vscodeMock }, () => {
    const module = importFresh<DiagnosticsModule>("../src/diagnostics");
    return module.toDiagnostics(problems);
  });

  // Then / Should
  assert.equal(diagnostics.length, 3);
  assert.equal((diagnostics[0] as any).severity, 0);
  assert.equal((diagnostics[1] as any).severity, 1);
  assert.equal((diagnostics[2] as any).severity, 2);
  assert.equal((diagnostics[0] as any).source, "Solhint");
  assert.equal((diagnostics[0] as any).code, "err-rule");
  assert.deepEqual({ ...(diagnostics[0] as any).range }, { startLine: 1, startChar: 2, endLine: 1, endChar: 3 });
  assert.deepEqual({ ...(diagnostics[2] as any).range }, { startLine: 0, startChar: 0, endLine: 0, endChar: 1 });
});
