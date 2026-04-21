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
          `Error: File not found: ${resolvedPath}`,
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
    `## Accessibility Validation: ${path.basename(filePath)}`,
    "",
    `**Summary:** ${stats.total} issue(s) — ${stats.errors} error(s), ${stats.warnings} warning(s), ${stats.notices} notice(s)`,
    "",
  ];

  if (issues.length === 0) {
    lines.push("✅ No accessibility issues found.");
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
    lines.push(
      `### ${icon} ${severity.charAt(0).toUpperCase() + severity.slice(1)}s (${list.length})`,
    );
    lines.push("");
    for (const issue of list) {
      lines.push(`**[${issue.ruleId}]** Line ${issue.line}: ${issue.message}`);
      lines.push(
        `- WCAG: ${issue.wcagCriteria.join(", ")} (Level ${issue.wcagLevel})`,
      );
      lines.push(`- Element: \`${issue.element}\``);
      lines.push(`- Fix: ${issue.fix}`);
      lines.push(`- Reference: ${issue.helpUrl}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}
