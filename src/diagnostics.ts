import * as vscode from "vscode";
import * as path from "path";
import { validateContent } from "./validator";
import type { A11yIssue } from "./validator";
import { contentHash } from "./utils";

export class A11yDiagnosticsProvider {
  private readonly collection: vscode.DiagnosticCollection;
  private readonly cache = new Map<string, { hash: string }>();
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

    const content = document.getText();
    const key = document.uri.toString();
    const hash = contentHash(content);

    // Incremental cache — skip unchanged files
    const cached = this.cache.get(key);
    if (cached && cached.hash === hash) {
      return;
    }

    const result = validateContent(content, document.fileName);
    const diagnostics = result.issues.map((issue) =>
      this.issueToDiagnostic(issue, document),
    );
    this.collection.set(document.uri, diagnostics);
    this.cache.set(key, { hash });
  }

  clearDocument(uri: vscode.Uri): void {
    this.collection.delete(uri);
    this.cache.delete(uri.toString());
  }

  dispose(): void {
    this.collection.dispose();
    this.cache.clear();
  }

  private issueToDiagnostic(
    issue: A11yIssue,
    document: vscode.TextDocument,
  ): vscode.Diagnostic {
    // Convert 1-based line/column to 0-based for VS Code Range
    const line = Math.max(0, Math.min(issue.line - 1, document.lineCount - 1));
    const col = Math.max(0, issue.column - 1);

    // Try to get the actual line length to create a meaningful range
    const textLine = document.lineAt(line);
    const rangeEnd = textLine.range.end.character;

    const range = new vscode.Range(
      new vscode.Position(line, Math.min(col, rangeEnd)),
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
        vscode.l10n.t(
          "WCAG {0} (Level {1}) — {2}",
          issue.wcagCriteria.join(", "),
          issue.wcagLevel,
          vscode.l10n.t(issue.fix),
        ),
      ),
    ];

    return diagnostic;
  }
}
