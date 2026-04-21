import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { validateContent } from "../validator";
import type { ValidationResult } from "../validator";

export interface ValidateFileInput {
  filePath: string;
}

export class ValidateFileTool implements vscode.LanguageModelTool<ValidateFileInput> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<ValidateFileInput>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const { filePath } = options.input;

    // Resolve to absolute path, supporting workspace-relative paths
    let resolvedPath = filePath;
    if (!path.isAbsolute(filePath)) {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (workspaceRoot) {
        resolvedPath = path.join(workspaceRoot, filePath);
      }
    }

    if (!fs.existsSync(resolvedPath)) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          vscode.l10n.t("Error: File not found: {0}", resolvedPath),
        ),
      ]);
    }

    const content = fs.readFileSync(resolvedPath, "utf-8");
    const result: ValidationResult = validateContent(content, resolvedPath);

    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(formatValidationResult(result)),
    ]);
  }
}

function formatValidationResult(result: ValidationResult): string {
  const { filePath, issues, stats } = result;
  const lines: string[] = [
    vscode.l10n.t("## Accessibility Validation: {0}", path.basename(filePath)),
    "",
    vscode.l10n.t(
      "**Summary:** {0} issue(s) — {1} error(s), {2} warning(s), {3} notice(s)",
      stats.total,
      stats.errors,
      stats.warnings,
      stats.notices,
    ),
    "",
  ];

  if (issues.length === 0) {
    lines.push(vscode.l10n.t("✅ No accessibility issues found."));
    return lines.join("\n");
  }

  const grouped = {
    error: issues.filter((i) => i.severity === "error"),
    warning: issues.filter((i) => i.severity === "warning"),
    notice: issues.filter((i) => i.severity === "notice"),
  };

  for (const [severity, list] of Object.entries(grouped)) {
    if (list.length === 0) continue;
    const icon =
      severity === "error" ? "🔴" : severity === "warning" ? "🟡" : "🔵";
    const severityLabel =
      severity === "error"
        ? vscode.l10n.t("Errors")
        : severity === "warning"
          ? vscode.l10n.t("Warnings")
          : vscode.l10n.t("Notices");
    lines.push(`### ${icon} ${severityLabel} (${list.length})`);
    lines.push("");
    for (const issue of list) {
      lines.push(
        vscode.l10n.t(
          "**[{0}]** Line {1}: {2}",
          issue.ruleId,
          issue.line,
          issue.message,
        ),
      );
      lines.push(
        vscode.l10n.t(
          "- WCAG: {0} (Level {1})",
          issue.wcagCriteria.join(", "),
          issue.wcagLevel,
        ),
      );
      lines.push(vscode.l10n.t("- Element: `{0}`", issue.element));
      lines.push(vscode.l10n.t("- Fix: {0}", vscode.l10n.t(issue.fix)));
      lines.push(vscode.l10n.t("- Reference: {0}", issue.helpUrl));
      lines.push("");
    }
  }

  return lines.join("\n");
}
