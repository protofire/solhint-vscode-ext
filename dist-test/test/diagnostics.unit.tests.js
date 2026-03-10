"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const moduleMocks_1 = require("./support/moduleMocks");
(0, node_test_1.default)("Given problems with all severities, when converting to diagnostics, then it should map severities and metadata", () => {
    // Given
    const vscodeMock = {
        DiagnosticSeverity: { Error: 0, Warning: 1, Information: 2 },
        Range: class Range {
            constructor(startLine, startChar, endLine, endChar) {
                this.startLine = startLine;
                this.startChar = startChar;
                this.endLine = endLine;
                this.endChar = endChar;
            }
        },
        Diagnostic: class Diagnostic {
            constructor(range, message, severity) {
                this.range = range;
                this.message = message;
                this.severity = severity;
            }
        },
    };
    const problems = [
        { ruleId: "err-rule", message: "Error", line: 2, column: 3, severity: 2 },
        { ruleId: "warn-rule", message: "Warning", line: 1, column: 1, severity: 3 },
        { ruleId: "info-rule", message: "Info", line: 0, column: 0, severity: 1 },
    ];
    // When
    const diagnostics = (0, moduleMocks_1.withPatchedModuleLoader)({ vscode: vscodeMock }, () => {
        const module = (0, moduleMocks_1.importFresh)("../src/diagnostics");
        return module.toDiagnostics(problems);
    });
    // Then / Should
    strict_1.default.equal(diagnostics.length, 3);
    strict_1.default.equal(diagnostics[0].severity, 0);
    strict_1.default.equal(diagnostics[1].severity, 1);
    strict_1.default.equal(diagnostics[2].severity, 2);
    strict_1.default.equal(diagnostics[0].source, "Solhint");
    strict_1.default.equal(diagnostics[0].code, "err-rule");
    strict_1.default.deepEqual({ ...diagnostics[0].range }, { startLine: 1, startChar: 2, endLine: 1, endChar: 3 });
    strict_1.default.deepEqual({ ...diagnostics[2].range }, { startLine: 0, startChar: 0, endLine: 0, endChar: 1 });
});
