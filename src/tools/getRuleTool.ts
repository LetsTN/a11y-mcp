import * as vscode from "vscode";
import { RULES, RULE_IDS } from "../validator";

export interface GetRuleInput {
  ruleId: string;
}

export class GetRuleTool implements vscode.LanguageModelTool<GetRuleInput> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<GetRuleInput>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const { ruleId } = options.input;

    const rule = RULES[ruleId];
    if (rule) {
      const lines = [
        `## Accessibility Rule: ${rule.id}`,
        "",
        `**Title:** ${rule.title}`,
        `**WCAG Criteria:** ${rule.wcagCriteria.join(", ")}`,
        `**WCAG Level:** ${rule.wcagLevel}`,
        `**Default Severity:** ${rule.severity}`,
        "",
        `### Description`,
        rule.description,
        "",
        `### How to Fix`,
        rule.fix,
        "",
        `### Reference`,
        rule.helpUrl,
      ];
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(lines.join("\n")),
      ]);
    }

    // Fuzzy search: find rules whose ID or title contains the query
    const query = ruleId.toLowerCase();
    const matches = RULE_IDS.filter(
      (id) =>
        id.includes(query) || RULES[id].title.toLowerCase().includes(query),
    );

    if (matches.length === 0) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `No rule found with ID "${ruleId}".\n\nAvailable rules: ${RULE_IDS.join(", ")}`,
        ),
      ]);
    }

    const lines = [
      `No exact match for "${ruleId}". Did you mean one of these?`,
      "",
      ...matches.map(
        (id) =>
          `- **${id}**: ${RULES[id].title} (WCAG ${RULES[id].wcagCriteria.join(", ")}, Level ${RULES[id].wcagLevel})`,
      ),
    ];
    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(lines.join("\n")),
    ]);
  }
}
