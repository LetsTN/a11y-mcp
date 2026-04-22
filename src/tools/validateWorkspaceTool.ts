import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { validateContent } from "../validator";
import type { ValidationResult, WorkspaceValidationResult } from "../validator";
import { collectWorkspaceFiles } from "../utils";

export interface ValidateWorkspaceInput {
  folder?: string;
  maxFiles?: number;
}

const DEFAULT_MAX_FILES = 100;

export class ValidateWorkspaceTool implements vscode.LanguageModelTool<ValidateWorkspaceInput> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<ValidateWorkspaceInput>,
    token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const { folder, maxFiles = DEFAULT_MAX_FILES } = options.input;
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!workspaceRoot) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          vscode.l10n.t("Error: No workspace folder is open."),
        ),
      ]);
    }

    const scanRoot = folder
      ? path.resolve(workspaceRoot, folder)
      : workspaceRoot;

    if (!fs.existsSync(scanRoot)) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          vscode.l10n.t("Error: Folder not found: {0}", scanRoot),
        ),
      ]);
    }

    const files = await collectWorkspaceFiles(scanRoot, maxFiles);

    if (files.length === 0) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          vscode.l10n.t(
            "No supported HTML/JSX/TSX files found in the specified location.",
          ),
        ),
      ]);
    }

    const results: ValidationResult[] = [];
    for (const file of files) {
      if (token.isCancellationRequested) break;
      try {
        const content = fs.readFileSync(file, "utf-8");
        results.push(validateContent(content, file));
      } catch {
        // Skip unreadable files
      }
    }

    const summary: WorkspaceValidationResult = {
      totalFiles: results.length,
      filesWithIssues: results.filter((r) => r.issues.length > 0).length,
      totalErrors: results.reduce((s, r) => s + r.stats.errors, 0),
      totalWarnings: results.reduce((s, r) => s + r.stats.warnings, 0),
      totalNotices: results.reduce((s, r) => s + r.stats.notices, 0),
      results,
    };

    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(
        formatWorkspaceResult(summary, workspaceRoot),
      ),
    ]);
  }
}

function formatWorkspaceResult(
  summary: WorkspaceValidationResult,
  workspaceRoot: string,
): string {
  const lines: string[] = [
    vscode.l10n.t("## Workspace Accessibility Report"),
    "",
    vscode.l10n.t("**Scanned:** {0} file(s)", summary.totalFiles),
    vscode.l10n.t("**Files with issues:** {0}", summary.filesWithIssues),
    vscode.l10n.t(
      "**Total issues:** {0}",
      summary.totalErrors + summary.totalWarnings + summary.totalNotices,
    ),
    vscode.l10n.t("  - \ud83d\udd34 Errors: {0}", summary.totalErrors),
    vscode.l10n.t("  - \ud83d\udfe1 Warnings: {0}", summary.totalWarnings),
    vscode.l10n.t("  - \ud83d\udd35 Notices: {0}", summary.totalNotices),
    "",
  ];

  const filesWithIssues = summary.results.filter((r) => r.issues.length > 0);
  if (filesWithIssues.length === 0) {
    lines.push(
      vscode.l10n.t(
        "✅ No accessibility issues found across all scanned files.",
      ),
    );
    return lines.join("\n");
  }

  lines.push(vscode.l10n.t("### Files with issues"));
  lines.push("");

  for (const result of filesWithIssues) {
    const relPath = path.relative(workspaceRoot, result.filePath);
    lines.push(
      `#### 📄 ${relPath} — ${result.stats.errors}🔴 ${result.stats.warnings}🟡 ${result.stats.notices}🔵`,
    );
    lines.push("");
    for (const issue of result.issues.slice(0, 15)) {
      const icon =
        issue.severity === "error"
          ? "🔴"
          : issue.severity === "warning"
            ? "🟡"
            : "🔵";
      lines.push(
        `${icon} ${vscode.l10n.t("**[{0}]** Line {1}: {2}", issue.ruleId, issue.line, issue.message)}`,
      );
    }
    if (result.issues.length > 15) {
      lines.push(
        `  _${vscode.l10n.t("…and {0} more. Run \`a11y_validate_file\` on this file for the full list.", result.issues.length - 15)}_`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}
