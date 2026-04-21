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
        vscode.l10n.t("## Accessibility Rule: {0}", rule.id),
        "",
        vscode.l10n.t("**Title:** {0}", vscode.l10n.t(rule.title)),
        vscode.l10n.t("**WCAG Criteria:** {0}", rule.wcagCriteria.join(", ")),
        vscode.l10n.t("**WCAG Level:** {0}", rule.wcagLevel),
        vscode.l10n.t("**Default Severity:** {0}", rule.severity),
        "",
        vscode.l10n.t("### Description"),
        vscode.l10n.t(rule.description),
        "",
        vscode.l10n.t("### How to Fix"),
        vscode.l10n.t(rule.fix),
        "",
        vscode.l10n.t("### Reference"),
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
          vscode.l10n.t(
            'No rule found with ID "{0}".\n\nAvailable rules: {1}',
            ruleId,
            RULE_IDS.join(", "),
          ),
        ),
      ]);
    }

    const lines = [
      vscode.l10n.t(
        'No exact match for "{0}". Did you mean one of these?',
        ruleId,
      ),
      "",
      ...matches.map((id) =>
        vscode.l10n.t(
          "- **{0}**: {1} (WCAG {2}, Level {3})",
          id,
          vscode.l10n.t(RULES[id].title),
          RULES[id].wcagCriteria.join(", "),
          RULES[id].wcagLevel,
        ),
      ),
    ];
    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(lines.join("\n")),
    ]);
  }
}
