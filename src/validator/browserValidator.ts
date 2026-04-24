import * as vscode from "vscode";
import type { A11yIssue, ValidationResult, Severity, WcagLevel } from "./types";
import { validateHtml } from "./htmlValidator";
import { computeStats } from "../utils";

// ─── Playwright dynamic import ───────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let playwrightModule: any | null = null;
let playwrightChecked = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPlaywright(): any | null {
  if (playwrightChecked) return playwrightModule;
  playwrightChecked = true;
  try {
    playwrightModule = require("playwright");
  } catch {
    playwrightModule = null;
  }
  return playwrightModule;
}

export function isPlaywrightAvailable(): boolean {
  return getPlaywright() !== null;
}

// ─── axe-core source (bundled) ───────────────────────────────────────────────

let axeSource: string | null = null;

function getAxeSource(): string {
  if (axeSource) return axeSource;
  // axe-core is bundled by esbuild — require its source for injection
  const axe = require("axe-core");
  axeSource = axe.source as string;
  return axeSource;
}

// ─── axe-core result types ───────────────────────────────────────────────────

interface AxeNode {
  html: string;
  target: string[];
  failureSummary?: string;
}

interface AxeViolation {
  id: string;
  impact: "critical" | "serious" | "moderate" | "minor" | null;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: AxeNode[];
}

interface AxeResults {
  violations: AxeViolation[];
}

// ─── Map axe impact → our severity ──────────────────────────────────────────

function mapImpact(impact: string | null): Severity {
  switch (impact) {
    case "critical":
    case "serious":
      return "error";
    case "moderate":
      return "warning";
    default:
      return "notice";
  }
}

// ─── Extract WCAG criteria from axe tags ─────────────────────────────────────

function extractWcagCriteria(tags: string[]): {
  criteria: string[];
  level: WcagLevel;
} {
  const criteria: string[] = [];
  let level: WcagLevel = "A";

  for (const tag of tags) {
    // Tags like "wcag111" → "1.1.1", "wcag2411" → "2.4.11"
    const match = tag.match(/^wcag(\d)(\d)(\d+)$/);
    if (match) {
      criteria.push(`${match[1]}.${match[2]}.${match[3]}`);
    }
    // Level tags
    if (tag === "wcag2aa" || tag === "wcag21aa" || tag === "wcag22aa") {
      if (level === "A") level = "AA";
    }
    if (tag === "wcag2aaa") {
      level = "AAA";
    }
  }

  if (criteria.length === 0) criteria.push("best-practice");
  return { criteria, level };
}

// ─── Convert axe violation → A11yIssue[] ─────────────────────────────────────

function axeViolationToIssues(violation: AxeViolation): A11yIssue[] {
  const { criteria, level } = extractWcagCriteria(violation.tags);
  const severity = mapImpact(violation.impact);

  return violation.nodes.map((node) => ({
    ruleId: `axe:${violation.id}`,
    severity,
    wcagCriteria: criteria,
    wcagLevel: level,
    message: violation.help,
    element: node.html.substring(0, 120),
    selector: node.target.join(" > "),
    line: 0,
    column: 0,
    fix: node.failureSummary ?? violation.description,
    helpUrl: violation.helpUrl,
  }));
}

// ─── Main browser validation ─────────────────────────────────────────────────

export interface BrowserValidationResult {
  /** Our static HTML analysis on the rendered DOM */
  staticResult: ValidationResult;
  /** axe-core runtime analysis */
  axeIssues: A11yIssue[];
  axeStats: ValidationResult["stats"];
  /** The rendered HTML (for reference) */
  renderedHtml: string;
  /** Whether the page was a CSR app (body was different after JS execution) */
  wasCSR: boolean;
}

export async function validateWithBrowser(
  url: string,
): Promise<BrowserValidationResult> {
  const pw = getPlaywright()!;

  const browser = await pw.chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      userAgent:
        "Mozilla/5.0 (A11y-MCP Validator) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    });
    const page = await context.newPage();

    // Navigate and wait for network idle (gives JS time to render)
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    // Get rendered HTML (after JS execution)
    const renderedHtml = await page.content();

    // Run our static HTML validator on the rendered DOM
    const staticResult = validateHtml(renderedHtml, url);

    // Inject and run axe-core
    const axeSrc = getAxeSource();
    /* eslint-disable no-eval */
    const axeResults: AxeResults = await page.evaluate(
      `
      new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.textContent = ${JSON.stringify("%%AXE_SOURCE%%")}.replace("%%AXE_SOURCE%%", "");
        document.head.appendChild(script);
        setTimeout(() => {
          try {
            const axe = window.axe;
            if (!axe) { reject(new Error("axe-core failed to load")); return; }
            axe.run(document, {
              resultTypes: ["violations"],
              runOnly: {
                type: "tag",
                values: ["wcag2a","wcag2aa","wcag2aaa","wcag21a","wcag21aa","wcag22aa","best-practice"]
              }
            }).then(r => resolve(r)).catch(reject);
          } catch (e) { reject(e); }
        }, 100);
      })
    `.replace(
        `${JSON.stringify("%%AXE_SOURCE%%")}.replace("%%AXE_SOURCE%%", "")`,
        JSON.stringify(axeSrc),
      ),
    );

    // Convert axe violations to our issue format
    const axeIssues: A11yIssue[] = [];
    for (const violation of axeResults.violations) {
      axeIssues.push(...axeViolationToIssues(violation));
    }

    // Detect if the page was CSR (compare body text content)
    const bodyText: string = await page.evaluate(
      `(document.body && document.body.textContent || "").trim().substring(0, 500)`,
    );
    const wasCSR = bodyText.length > 50; // If rendered body has content, JS was needed

    await context.close();

    return {
      staticResult,
      axeIssues,
      axeStats: computeStats(axeIssues),
      renderedHtml,
      wasCSR,
    };
  } finally {
    await browser.close();
  }
}
