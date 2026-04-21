import * as vscode from "vscode";
import * as http from "http";
import * as https from "https";
import { validateHtml } from "../validator/htmlValidator";
import type { ValidationResult } from "../validator/types";

export interface ValidateUrlInput {
  url: string;
}

/** Fetches the HTML content of a URL using Node's built-in http/https. */
function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https://") ? https : http;
    const req = client.get(url, { timeout: 10000 }, (res) => {
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        // Follow one redirect
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out after 10s"));
    });
  });
}

/**
 * Detects common signatures of a Client-Side Rendered (CSR) app:
 * - <body> has only empty root mount points (e.g. <div id="root"></div>)
 * - <noscript> with "enable JavaScript" text
 * Returns a CSR warning string if detected, or null if the page looks server-rendered.
 */
function detectCsr(html: string): string | null {
  const lower = html.toLowerCase();

  // Noscript "enable javascript" — classic CRA / Vite SPA signature
  if (lower.includes("you need to enable javascript")) {
    return "cra";
  }

  // Extract <body> content and check if it is essentially empty mounts
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    const body = bodyMatch[1]
      .replace(/<!--[\s\S]*?-->/g, "") // strip comments
      .replace(/<script[\s\S]*?<\/script>/gi, "") // strip scripts
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "") // strip noscripts
      .trim();

    // If after stripping scripts/noscripts the body is just empty divs
    const strippedBody = body.replace(/<div[^>]*>\s*<\/div>/gi, "").trim();
    if (strippedBody.length === 0 && body.length > 0) {
      return "vite_or_cra";
    }

    // Very short body with known CSR root patterns
    if (
      body.length < 200 &&
      /<div\s[^>]*id=["'](root|app)["'][^>]*>\s*<\/div>/i.test(body)
    ) {
      return "empty_root";
    }
  }

  return null;
}

export class ValidateUrlTool implements vscode.LanguageModelTool<ValidateUrlInput> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<ValidateUrlInput>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const { url } = options.input;

    // Basic URL validation
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          vscode.l10n.t("Error: Invalid URL: {0}", url),
        ),
      ]);
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          vscode.l10n.t("Error: Only http:// and https:// URLs are supported."),
        ),
      ]);
    }

    let html: string;
    try {
      html = await fetchUrl(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          vscode.l10n.t("Error: Could not fetch {0} — {1}", url, msg),
        ),
      ]);
    }

    const csrType = detectCsr(html);
    const warnings: string[] = [];

    if (csrType) {
      warnings.push(
        vscode.l10n.t(
          "⚠️ **CSR detected:** This page appears to be a Client-Side Rendered (SPA) application. " +
            "The HTML returned by the server is mostly empty — the real content is injected by JavaScript at runtime in the browser. " +
            "**The validation below only covers the static HTML shell and will miss most issues.** " +
            "For accurate results, use a server-side rendered framework (Next.js, Remix, Nuxt) or validate your source `.jsx`/`.tsx` files directly.",
        ),
      );
    }

    const result: ValidationResult = validateHtml(html, url);

    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(formatUrlResult(url, result, warnings)),
    ]);
  }
}

function formatUrlResult(
  url: string,
  result: ValidationResult,
  warnings: string[],
): string {
  const { issues, stats } = result;
  const lines: string[] = [
    vscode.l10n.t("## Accessibility Validation: {0}", url),
    "",
  ];

  if (warnings.length > 0) {
    lines.push(...warnings, "");
  }

  lines.push(
    vscode.l10n.t(
      "**Summary:** {0} issue(s) — {1} error(s), {2} warning(s), {3} notice(s)",
      stats.total,
      stats.errors,
      stats.warnings,
      stats.notices,
    ),
    "",
  );

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
