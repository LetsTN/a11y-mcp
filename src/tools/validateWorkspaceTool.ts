import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { validateContent, SUPPORTED_EXTENSIONS } from "../validator";
import type { ValidationResult, WorkspaceValidationResult } from "../validator";

export interface ValidateWorkspaceInput {
  folder?: string;
  maxFiles?: number;
}

const DEFAULT_MAX_FILES = 100;
const EXCLUDE_PATTERNS = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.git/**",
  "**/out/**",
  "**/.next/**",
  "**/coverage/**",
];

export class ValidateWorkspaceTool implements vscode.LanguageModelTool<ValidateWorkspaceInput> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<ValidateWorkspaceInput>,
    token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const { folder, maxFiles = DEFAULT_MAX_FILES } = options.input;
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!workspaceRoot) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Error: No workspace folder is open."),
      ]);
    }

    const scanRoot = folder
      ? path.resolve(workspaceRoot, folder)
      : workspaceRoot;

    if (!fs.existsSync(scanRoot)) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Error: Folder not found: ${scanRoot}`,
        ),
      ]);
    }

    const files = collectFiles(scanRoot, maxFiles);

    if (files.length === 0) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          "No supported HTML/JSX/TSX files found in the specified location.",
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

function collectFiles(dir: string, max: number): string[] {
  const result: string[] = [];

  function walk(current: string): void {
    if (result.length >= max) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (result.length >= max) return;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (shouldExcludeDir(entry.name)) continue;
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          result.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return result;
}

function shouldExcludeDir(name: string): boolean {
  return [
    "node_modules",
    "dist",
    "build",
    ".git",
    "out",
    ".next",
    "coverage",
    ".cache",
    "vendor",
  ].includes(name);
}

function formatWorkspaceResult(
  summary: WorkspaceValidationResult,
  workspaceRoot: string,
): string {
  const lines: string[] = [
    "## Workspace Accessibility Report",
    "",
    `**Scanned:** ${summary.totalFiles} file(s)`,
    `**Files with issues:** ${summary.filesWithIssues}`,
    `**Total issues:** ${summary.totalErrors + summary.totalWarnings + summary.totalNotices}`,
    `  - 🔴 Errors: ${summary.totalErrors}`,
    `  - 🟡 Warnings: ${summary.totalWarnings}`,
    `  - 🔵 Notices: ${summary.totalNotices}`,
    "",
  ];

  const filesWithIssues = summary.results.filter((r) => r.issues.length > 0);
  if (filesWithIssues.length === 0) {
    lines.push("✅ No accessibility issues found across all scanned files.");
    return lines.join("\n");
  }

  lines.push("### Files with issues");
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
        `${icon} **[${issue.ruleId}]** Line ${issue.line}: ${issue.message}`,
      );
    }
    if (result.issues.length > 15) {
      lines.push(
        `  _…and ${result.issues.length - 15} more. Run \`a11y_validate_file\` on this file for the full list._`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}
