export type Severity = "error" | "warning" | "notice";
export type WcagLevel = "A" | "AA" | "AAA";

export interface A11yRule {
  id: string;
  title: string;
  description: string;
  wcagCriteria: string[];
  wcagLevel: WcagLevel;
  severity: Severity;
  helpUrl: string;
  fix: string;
}

export interface A11yIssue {
  ruleId: string;
  severity: Severity;
  wcagCriteria: string[];
  wcagLevel: WcagLevel;
  message: string;
  /** Truncated outer HTML of the offending element */
  element: string;
  /** CSS-style selector hint to locate the element */
  selector: string;
  line: number;
  column: number;
  fix: string;
  helpUrl: string;
}

export interface ValidationResult {
  filePath: string;
  issues: A11yIssue[];
  stats: {
    errors: number;
    warnings: number;
    notices: number;
    total: number;
  };
}

export interface WorkspaceValidationResult {
  totalFiles: number;
  filesWithIssues: number;
  totalErrors: number;
  totalWarnings: number;
  totalNotices: number;
  results: ValidationResult[];
}

// ─── Component mapping (for React / library validation) ──────────────────────

export interface ComponentMapping {
  /** Native HTML element this component renders as (e.g. "button", "a", "img") */
  as: string;
  /** Maps standard HTML attribute names to the component's prop names.
   *  Example: { "aria-label": "ariaLabel", "href": "to" }
   *  Unmapped attributes are looked up by their standard name. */
  propMap?: Record<string, string>;
}

/** Map of React/library component names to their HTML element semantics. */
export type ComponentMap = Record<string, ComponentMapping>;
