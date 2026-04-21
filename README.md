# A11y MCP — Accessibility Validator

> Validates **WCAG 2.2 (AAA)** accessibility in HTML, JSX and TSX files — directly in VS Code, with inline diagnostics and GitHub Copilot tools.

![VS Code](https://img.shields.io/badge/VS_Code-^1.95-007ACC?logo=visualstudiocode&logoColor=white)
![WCAG 2.2](https://img.shields.io/badge/WCAG-2.2_AAA-6B21A8)
![License: MIT](https://img.shields.io/badge/license-MIT-22c55e)

---

## Features

### Inline diagnostics

Issues appear instantly in the **Problems panel** (and as underlines in the editor) every time you open or save a file.

![Problems panel showing accessibility issues found in an HTML file](https://raw.githubusercontent.com/LetsTN/a11y-mcp/main/images/screenshot-diagnostics.png)

### GitHub Copilot tools (MCP)

Ask Copilot Chat to audit your files or explain any rule:

| Tool                      | What it does                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------- |
| `a11y_validate_file`      | Full report for a single file — line, rule, WCAG criterion, severity and fix suggestion |
| `a11y_validate_workspace` | Scans all HTML/JSX/TSX files and returns a health summary                               |
| `a11y_get_rule`           | Explains any rule in detail (e.g. `img_01b`, `hx_03`, `aria_02`)                        |

**Example prompts:**

```
Validate the accessibility of src/pages/Home.tsx
```

```
What does rule hx_03 mean and how do I fix it?
```

```
Scan the entire workspace for WCAG errors and give me a summary
```

### Commands

| Command                       | Description                               |
| ----------------------------- | ----------------------------------------- |
| `A11y: Validate Current File` | Run on the active editor tab              |
| `A11y: Validate Workspace`    | Scan all supported files in the workspace |

---

## Rules covered

The extension implements **30+ rules** based on the [AccessMonitor ruleset](https://amagovpt.github.io/accessmonitor-rulesets/) and [WCAG 2.2](https://www.w3.org/TR/WCAG22/), across all four WCAG principles:

| Category         | Rules                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------- |
| **Images**       | Missing alt, uninformative alt, alt too long, decorative not hidden                       |
| **Links**        | Missing accessible name, adjacent identical links, identical text different URLs          |
| **Buttons**      | Missing accessible name                                                                   |
| **Forms**        | Missing label, missing submit button, dangling label, missing autocomplete                |
| **Headings**     | Empty heading, no H1, multiple H1, skipped levels, no headings at all                     |
| **Page**         | Missing `<title>`, empty title, missing `lang`, invalid `lang`                            |
| **Landmarks**    | Missing `<main>`, duplicate `<main>`, missing skip navigation link                        |
| **Tables**       | No `<th>`, no `<caption>`, nested tables                                                  |
| **Frames**       | `<iframe>` without title                                                                  |
| **SVG**          | Meaningful SVG without accessible name                                                    |
| **ARIA**         | Invalid role, missing required attribute, unknown `aria-*` attribute                      |
| **IDs**          | Duplicate `id` attributes                                                                 |
| **Meta**         | Zoom disabled in viewport, auto-refresh/redirect                                          |
| **Media**        | `<video>`/`<audio>` without controls                                                      |
| **Events**       | Mouse-only event handlers (no keyboard equivalent), `tabindex > 0`                        |
| **Obsolete**     | Deprecated presentational elements (`<center>`, `<font>`, etc.), non-semantic `<b>`/`<i>` |
| **JSX-specific** | `onClick` on non-interactive element without role or keyboard handler                     |

---

## Supported file types

- HTML (`.html`, `.htm`)
- JSX / TSX (`.jsx`, `.tsx`)
- JavaScript / TypeScript with JSX (`.js`, `.ts`)

---

## Extension Settings

| Setting              | Default                                 | Description                                       |
| -------------------- | --------------------------------------- | ------------------------------------------------- |
| `a11y-mcp.wcagLevel` | `AAA`                                   | Minimum WCAG conformance level (`A`, `AA`, `AAA`) |
| `a11y-mcp.include`   | `["**/*.html", "**/*.jsx", "**/*.tsx"]` | Glob patterns for files to validate               |
| `a11y-mcp.exclude`   | `["**/node_modules/**", ...]`           | Glob patterns to exclude from validation          |

---

## How diagnostics work

Each issue shows:

- **Rule ID** — e.g. `img_01b`
- **Severity** — Error 🔴, Warning 🟡, or Notice 🔵
- **WCAG criterion** — e.g. `1.1.1`, `2.4.4`
- **Conformance level** — A, AA, or AAA
- **Fix suggestion** — actionable description of what to change
- **Reference link** — AccessMonitor rule page

---

## References

- [AccessMonitor Rulesets](https://amagovpt.github.io/accessmonitor-rulesets/)
- [WCAG 2.2 — W3C](https://www.w3.org/TR/WCAG22/)
- [WAI-ARIA 1.2 — W3C](https://www.w3.org/TR/wai-aria-1.2/)
- [ACT Rules Community Group](https://act-rules.github.io/rules/)

---

## Contributing

Issues and pull requests are welcome at [github.com/LetsTN/a11y-mcp](https://github.com/LetsTN/a11y-mcp).

## License

[MIT](LICENSE)
