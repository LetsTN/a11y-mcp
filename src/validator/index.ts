import * as path from "path";
import * as fs from "fs";
import type { ValidationResult } from "./types";
import { validateHtml } from "./htmlValidator";
import { validateJsx } from "./jsxValidator";
import {
  getWcagLevel,
  filterByWcagLevel,
  computeStats,
  loadComponentMap,
} from "../utils";

export { validateHtml } from "./htmlValidator";
export { validateJsx } from "./jsxValidator";
export * from "./types";
export * from "./rules";

export const SUPPORTED_EXTENSIONS = new Set([
  ".html",
  ".htm",
  ".jsx",
  ".tsx",
  ".js",
  ".ts",
]);

/** Validate a file by auto-detecting its type. Returns null if unsupported. */
export async function validateFile(
  filePath: string,
): Promise<ValidationResult | null> {
  const ext = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) return null;

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }

  return validateContent(content, filePath);
}

/** Validate raw content. The filePath extension determines which validator is used.
 *  Results are filtered by the configured WCAG level.
 *  For JSX/TSX, loads the component map from `.a11y-mcp.json` automatically. */
export function validateContent(
  content: string,
  filePath: string,
): ValidationResult {
  const ext = path.extname(filePath).toLowerCase();
  const result =
    ext === ".html" || ext === ".htm"
      ? validateHtml(content, filePath)
      : validateJsx(content, filePath, loadComponentMap());

  // Apply WCAG level filter from user settings
  const level = getWcagLevel();
  result.issues = filterByWcagLevel(result.issues, level);
  result.stats = computeStats(result.issues);

  return result;
}
