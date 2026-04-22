import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import type {
  A11yIssue,
  WcagLevel,
  ValidationResult,
  ComponentMap,
} from "./validator/types";

// ─── WCAG Level Filtering ────────────────────────────────────────────────────

const LEVEL_WEIGHT: Record<WcagLevel, number> = { A: 1, AA: 2, AAA: 3 };

/** Read the configured WCAG level from extension settings. */
export function getWcagLevel(): WcagLevel {
  return (
    vscode.workspace.getConfiguration("a11y-mcp").get<WcagLevel>("wcagLevel") ??
    "AAA"
  );
}

/** Filter issues to only those at or below the configured WCAG level. */
export function filterByWcagLevel(
  issues: A11yIssue[],
  maxLevel: WcagLevel,
): A11yIssue[] {
  const max = LEVEL_WEIGHT[maxLevel];
  return issues.filter((i) => LEVEL_WEIGHT[i.wcagLevel] <= max);
}

// ─── Stats ───────────────────────────────────────────────────────────────────

/** Compute error/warning/notice counts in a single pass. */
export function computeStats(issues: A11yIssue[]): ValidationResult["stats"] {
  let errors = 0,
    warnings = 0,
    notices = 0;
  for (const i of issues) {
    if (i.severity === "error") errors++;
    else if (i.severity === "warning") warnings++;
    else notices++;
  }
  return { errors, warnings, notices, total: issues.length };
}

// ─── Content Hashing ─────────────────────────────────────────────────────────

/** Fast content hash for incremental validation cache. */
export function contentHash(content: string): string {
  return crypto.createHash("md5").update(content).digest("hex");
}

// ─── Workspace File Collection ───────────────────────────────────────────────

/**
 * Collect workspace files using the user's include/exclude configuration.
 * Uses vscode.workspace.findFiles to respect .gitignore and VS Code settings.
 */
export async function collectWorkspaceFiles(
  scanRoot?: string,
  maxFiles: number = 100,
): Promise<string[]> {
  const config = vscode.workspace.getConfiguration("a11y-mcp");
  const includes = config.get<string[]>("include", [
    "**/*.html",
    "**/*.jsx",
    "**/*.tsx",
  ]);
  const excludes = config.get<string[]>("exclude", [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
  ]);

  const includeGlob =
    includes.length === 1 ? includes[0] : `{${includes.join(",")}}`;
  const excludeGlob =
    excludes.length === 1 ? excludes[0] : `{${excludes.join(",")}}`;

  const pattern = scanRoot
    ? new vscode.RelativePattern(vscode.Uri.file(scanRoot), includeGlob)
    : includeGlob;

  const uris = await vscode.workspace.findFiles(pattern, excludeGlob, maxFiles);
  return uris.map((u) => u.fsPath);
}

// ─── Component Map Configuration ─────────────────────────────────────────────

interface A11yConfig {
  components?: ComponentMap;
}

let cachedConfig: A11yConfig | null = null;
let cachedConfigPath: string | null = null;

/**
 * Load the component-to-HTML mapping from the workspace config file.
 * Results are cached; call `clearConfigCache()` to force a reload.
 * Returns an empty map if no config file exists.
 */
export function loadComponentMap(): ComponentMap {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) return {};

  const configSetting = vscode.workspace
    .getConfiguration("a11y-mcp")
    .get<string>("configFile", ".a11y-mcp.json");
  const configPath = path.isAbsolute(configSetting)
    ? configSetting
    : path.join(workspaceRoot, configSetting);

  if (cachedConfigPath === configPath && cachedConfig) {
    return cachedConfig.components ?? {};
  }

  try {
    const content = fs.readFileSync(configPath, "utf-8");
    cachedConfig = JSON.parse(content) as A11yConfig;
    cachedConfigPath = configPath;
    return cachedConfig.components ?? {};
  } catch {
    return {};
  }
}

/** Clear the cached config so the next call to `loadComponentMap` re-reads the file. */
export function clearConfigCache(): void {
  cachedConfig = null;
  cachedConfigPath = null;
}
