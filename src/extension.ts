import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { A11yDiagnosticsProvider } from "./diagnostics";
import { A11yCodeActionProvider } from "./codeActions";
import { ValidateFileTool } from "./tools/validateFileTool";
import { ValidateWorkspaceTool } from "./tools/validateWorkspaceTool";
import { GetRuleTool } from "./tools/getRuleTool";
import { ValidateUrlTool } from "./tools/validateUrlTool";
import { validateContent } from "./validator";
import { collectWorkspaceFiles, clearConfigCache } from "./utils";

const SUPPORTED_LANGUAGES = new Set([
  "html",
  "javascriptreact",
  "typescriptreact",
  "javascript",
  "typescript",
]);

export function activate(context: vscode.ExtensionContext): void {
  const diagnosticsProvider = new A11yDiagnosticsProvider();
  context.subscriptions.push(diagnosticsProvider.diagnosticCollection);

  // ── Register MCP / LM tools ─────────────────────────────────────────────
  context.subscriptions.push(
    vscode.lm.registerTool("a11y_validate_file", new ValidateFileTool()),
    vscode.lm.registerTool(
      "a11y_validate_workspace",
      new ValidateWorkspaceTool(),
    ),
    vscode.lm.registerTool("a11y_get_rule", new GetRuleTool()),
    vscode.lm.registerTool("a11y_validate_url", new ValidateUrlTool()),
  );

  // ── Register Code Actions (QuickFix) ────────────────────────────────────
  const codeActionSelector: vscode.DocumentSelector = [
    { language: "html" },
    { language: "javascriptreact" },
    { language: "typescriptreact" },
    { language: "javascript" },
    { language: "typescript" },
  ];
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      codeActionSelector,
      new A11yCodeActionProvider(),
      {
        providedCodeActionKinds: A11yCodeActionProvider.providedCodeActionKinds,
      },
    ),
  );

  // ── Watch component-map config file ──────────────────────────────────
  const configGlob = vscode.workspace
    .getConfiguration("a11y-mcp")
    .get<string>("configFile", ".a11y-mcp.json");
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(
      vscode.workspace.workspaceFolders?.[0] ?? "",
      configGlob,
    ),
  );
  const onConfigChange = () => {
    clearConfigCache();
    // Re-validate all open supported documents
    vscode.workspace.textDocuments.forEach((doc) => {
      if (isSupported(doc)) diagnosticsProvider.validateDocument(doc);
    });
  };
  watcher.onDidChange(onConfigChange);
  watcher.onDidCreate(onConfigChange);
  watcher.onDidDelete(onConfigChange);
  context.subscriptions.push(watcher);

  // ── Diagnostics on document open / change / save ────────────────────────
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (isSupported(doc)) diagnosticsProvider.validateDocument(doc);
    }),
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (isSupported(doc)) diagnosticsProvider.validateDocument(doc);
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      diagnosticsProvider.clearDocument(doc.uri);
    }),
  );

  // Run on all already-open documents
  vscode.workspace.textDocuments.forEach((doc) => {
    if (isSupported(doc)) diagnosticsProvider.validateDocument(doc);
  });

  // ── Commands ────────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("a11y-mcp.validateFile", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage(
          vscode.l10n.t("A11y MCP: No active file to validate."),
        );
        return;
      }
      if (!isSupported(editor.document)) {
        vscode.window.showWarningMessage(
          vscode.l10n.t(
            "A11y MCP: Current file type is not supported. Open an HTML, JSX, or TSX file.",
          ),
        );
        return;
      }
      diagnosticsProvider.validateDocument(editor.document);
      const result = validateContent(
        editor.document.getText(),
        editor.document.fileName,
      );
      const { stats } = result;
      const msg =
        stats.total === 0
          ? vscode.l10n.t("✅ No accessibility issues found.")
          : vscode.l10n.t(
              "Found {0} error(s), {1} warning(s), {2} notice(s). See the Problems panel for details.",
              stats.errors,
              stats.warnings,
              stats.notices,
            );
      vscode.window.showInformationMessage(`A11y MCP: ${msg}`);
    }),

    vscode.commands.registerCommand("a11y-mcp.validateWorkspace", async () => {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        vscode.window.showWarningMessage(
          vscode.l10n.t("A11y MCP: No workspace folder open."),
        );
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: vscode.l10n.t("A11y MCP: Validating workspace…"),
          cancellable: true,
        },
        async (progress, token) => {
          const files = await collectWorkspaceFiles(workspaceRoot, 200);
          let totalErrors = 0,
            totalWarnings = 0,
            totalNotices = 0;

          for (let i = 0; i < files.length; i++) {
            if (token.isCancellationRequested) break;
            progress.report({
              message: vscode.l10n.t("{0}/{1} files", i + 1, files.length),
              increment: (1 / files.length) * 100,
            });

            const filePath = files[i];
            try {
              const content = fs.readFileSync(filePath, "utf-8");
              const fakeDoc = createFakeDocument(filePath, content);
              // validateDocument already calls validateContent internally
              diagnosticsProvider.validateDocument(fakeDoc);
              // Get stats from a fresh validation (cached result)
              const result = validateContent(content, filePath);
              totalErrors += result.stats.errors;
              totalWarnings += result.stats.warnings;
              totalNotices += result.stats.notices;
            } catch {
              // Skip unreadable files
            }
          }

          const total = totalErrors + totalWarnings + totalNotices;
          const msg =
            total === 0
              ? vscode.l10n.t(
                  "✅ All {0} file(s) passed accessibility checks.",
                  files.length,
                )
              : vscode.l10n.t(
                  "Scanned {0} file(s): {1} error(s), {2} warning(s), {3} notice(s). See Problems panel.",
                  files.length,
                  totalErrors,
                  totalWarnings,
                  totalNotices,
                );
          vscode.window.showInformationMessage(`A11y MCP: ${msg}`);
        },
      );
    }),
  );
}

export function deactivate(): void {
  // Resources are disposed via context.subscriptions
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isSupported(doc: vscode.TextDocument): boolean {
  return SUPPORTED_LANGUAGES.has(doc.languageId);
}

/** Creates a minimal fake TextDocument for use with the diagnostics provider.
 *  Only used for workspace-wide validation outside the normal editor lifecycle. */
function createFakeDocument(
  filePath: string,
  content: string,
): vscode.TextDocument {
  const lines = content.split("\n");
  const ext = path.extname(filePath).toLowerCase();
  const langMap: Record<string, string> = {
    ".html": "html",
    ".htm": "html",
    ".jsx": "javascriptreact",
    ".tsx": "typescriptreact",
    ".js": "javascript",
    ".ts": "typescript",
  };
  return {
    uri: vscode.Uri.file(filePath),
    fileName: filePath,
    languageId: langMap[ext] ?? "html",
    getText: () => content,
    lineAt: (lineOrPos: number | vscode.Position) => {
      const lineNum =
        typeof lineOrPos === "number"
          ? lineOrPos
          : (lineOrPos as vscode.Position).line;
      const text = lines[lineNum] ?? "";
      const range = new vscode.Range(lineNum, 0, lineNum, text.length);
      return {
        text,
        range,
        lineNumber: lineNum,
        firstNonWhitespaceCharacterIndex: text.search(/\S|$/),
        isEmptyOrWhitespace: text.trim().length === 0,
        rangeIncludingLineBreak: range,
      };
    },
    lineCount: lines.length,
  } as unknown as vscode.TextDocument;
}
