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
