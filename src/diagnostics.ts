import * as vscode from "vscode";
import * as path from "path";
import { validateContent } from "./validator";
import type { A11yIssue } from "./validator";

export class A11yDiagnosticsProvider {
  private readonly collection: vscode.DiagnosticCollection;
  private readonly SUPPORTED = new Set([
    ".html",
    ".htm",
    ".jsx",
    ".tsx",
    ".js",
    ".ts",
  ]);

  constructor() {
    this.collection = vscode.languages.createDiagnosticCollection("a11y-mcp");
  }

  get diagnosticCollection(): vscode.DiagnosticCollection {
    return this.collection;
  }

  validateDocument(document: vscode.TextDocument): void {
    const ext = path.extname(document.fileName).toLowerCase();
    if (!this.SUPPORTED.has(ext)) {
      this.collection.delete(document.uri);
      return;
    }

    const result = validateContent(document.getText(), document.fileName);
    const diagnostics = result.issues.map((issue) =>
      this.issueToDiagnostic(issue, document),
    );
    this.collection.set(document.uri, diagnostics);
  }

  clearDocument(uri: vscode.Uri): void {
    this.collection.delete(uri);
  }

  dispose(): void {
    this.collection.dispose();
  }

  private issueToDiagnostic(
    issue: A11yIssue,
    document: vscode.TextDocument,
  ): vscode.Diagnostic {
    // Convert 1-based line/column to 0-based for VS Code Range
    const line = Math.max(0, issue.line - 1);
    const col = Math.max(0, issue.column - 1);

    // Try to get the actual line length to create a meaningful range
    const textLine = document.lineAt(Math.min(line, document.lineCount - 1));
    const rangeEnd = textLine.range.end.character;

    const range = new vscode.Range(
      new vscode.Position(line, col),
      new vscode.Position(line, rangeEnd),
    );

    const severity =
      issue.severity === "error"
        ? vscode.DiagnosticSeverity.Error
        : issue.severity === "warning"
          ? vscode.DiagnosticSeverity.Warning
          : vscode.DiagnosticSeverity.Information;

    const diagnostic = new vscode.Diagnostic(
      range,
      `[${issue.ruleId}] ${issue.message}`,
      severity,
    );

    diagnostic.source = "a11y-mcp";
    diagnostic.code = {
      value: issue.ruleId,
      target: vscode.Uri.parse(issue.helpUrl),
    };
    diagnostic.relatedInformation = [
      new vscode.DiagnosticRelatedInformation(
        new vscode.Location(
          vscode.Uri.parse(issue.helpUrl),
          new vscode.Range(0, 0, 0, 0),
        ),
        `WCAG ${issue.wcagCriteria.join(", ")} (Level ${issue.wcagLevel}) — ${issue.fix}`,
      ),
    ];

    return diagnostic;
  }
}
