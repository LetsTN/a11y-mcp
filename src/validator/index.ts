import * as path from "path";
import * as fs from "fs";
import type { ValidationResult } from "./types";
import { validateHtml } from "./htmlValidator";
import { validateJsx } from "./jsxValidator";

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

/** Validate raw content. The filePath extension determines which validator is used. */
export function validateContent(
  content: string,
  filePath: string,
): ValidationResult {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html" || ext === ".htm") {
    return validateHtml(content, filePath);
  }
  return validateJsx(content, filePath);
}
