import * as vscode from "vscode";

export class A11yCodeActionProvider implements vscode.CodeActionProvider {
  static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    for (const diagnostic of context.diagnostics) {
      if (diagnostic.source !== "a11y-mcp") continue;
      const ruleId =
        typeof diagnostic.code === "object"
          ? String((diagnostic.code as { value: string | number }).value)
          : "";
      const fix = this.createFix(document, diagnostic, ruleId);
      if (fix) actions.push(fix);
    }
    return actions;
  }

  private createFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    ruleId: string,
  ): vscode.CodeAction | undefined {
    const line = document.lineAt(diagnostic.range.start.line);
    const text = line.text;

    switch (ruleId) {
      case "img_01b":
        return this.insertAttribute(
          document,
          diagnostic,
          line,
          text,
          /(<img)\b/i,
          'alt=""',
          vscode.l10n.t('Add alt="" to <img>'),
        );

      case "img_02":
        return this.insertAttribute(
          document,
          diagnostic,
          line,
          text,
          /(<img)\b/i,
          'role="presentation"',
          vscode.l10n.t('Add role="presentation" to decorative <img>'),
        );

      case "lang_03":
        return this.insertAttribute(
          document,
          diagnostic,
          line,
          text,
          /(<html)\b/i,
          'lang="en"',
          vscode.l10n.t('Add lang="en" to <html>'),
        );

      case "iframe_01":
        return this.insertAttribute(
          document,
          diagnostic,
          line,
          text,
          /(<iframe)\b/i,
          'title=""',
          vscode.l10n.t('Add title="" to <iframe>'),
        );

      case "audio_video_01":
        return this.insertAttribute(
          document,
          diagnostic,
          line,
          text,
          /(<(?:video|audio))\b/i,
          "controls",
          vscode.l10n.t("Add controls attribute"),
        );

      case "element_01": {
        const match = text.match(/tabindex\s*=\s*["']?\d+["']?/i);
        if (!match || match.index === undefined) return undefined;
        const action = new vscode.CodeAction(
          vscode.l10n.t('Change to tabindex="0"'),
          vscode.CodeActionKind.QuickFix,
        );
        action.diagnostics = [diagnostic];
        action.edit = new vscode.WorkspaceEdit();
        const range = new vscode.Range(
          line.lineNumber,
          match.index,
          line.lineNumber,
          match.index + match[0].length,
        );
        action.edit.replace(document.uri, range, 'tabindex="0"');
        action.isPreferred = true;
        return action;
      }

      case "meta_05": {
        const newText = text
          .replace(/,?\s*user-scalable\s*=\s*no/gi, "")
          .replace(/,?\s*maximum-scale\s*=\s*1(?:\.0+)?/gi, "");
        if (newText === text) return undefined;
        const action = new vscode.CodeAction(
          vscode.l10n.t("Remove zoom restriction from viewport"),
          vscode.CodeActionKind.QuickFix,
        );
        action.diagnostics = [diagnostic];
        action.edit = new vscode.WorkspaceEdit();
        action.edit.replace(document.uri, line.range, newText);
        action.isPreferred = true;
        return action;
      }

      case "font_01": {
        const bMatch = text.match(/<(b|i)\b/i);
        if (!bMatch) return undefined;
        const tag = bMatch[1].toLowerCase();
        const replacement = tag === "b" ? "strong" : "em";
        const action = new vscode.CodeAction(
          vscode.l10n.t("Replace <{0}> with <{1}>", tag, replacement),
          vscode.CodeActionKind.QuickFix,
        );
        action.diagnostics = [diagnostic];
        action.edit = new vscode.WorkspaceEdit();
        let newText = text.replace(
          new RegExp(`<${tag}\\b`, "gi"),
          `<${replacement}`,
        );
        newText = newText.replace(
          new RegExp(`</${tag}>`, "gi"),
          `</${replacement}>`,
        );
        action.edit.replace(document.uri, line.range, newText);
        action.isPreferred = true;
        return action;
      }

      default:
        return undefined;
    }
  }

  private insertAttribute(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    line: vscode.TextLine,
    text: string,
    tagRegex: RegExp,
    attribute: string,
    title: string,
  ): vscode.CodeAction | undefined {
    const match = text.match(tagRegex);
    if (!match || match.index === undefined) return undefined;
    const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
    action.diagnostics = [diagnostic];
    action.edit = new vscode.WorkspaceEdit();
    const insertPos = new vscode.Position(
      line.lineNumber,
      match.index + match[0].length,
    );
    action.edit.insert(document.uri, insertPos, ` ${attribute}`);
    action.isPreferred = true;
    return action;
  }
}
