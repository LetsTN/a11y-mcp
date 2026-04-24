# Changelog

All notable changes to **A11y MCP** will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.0] — 2026-04-22

### Added

- **Playwright + axe-core browser validation** for `a11y_validate_url`:
  - When `playwright` is installed, the tool launches a headless Chromium browser
  - Navigates to the URL and waits for JavaScript to render (supports CSR/SPA apps)
  - Runs all 85 static HTML rules on the **rendered** DOM
  - Injects and runs **axe-core** for deep runtime analysis: contrast ratios, focus visibility, keyboard traps, ARIA roles, status messages, and 50+ additional WCAG criteria
  - Results split into two sections: Static HTML Analysis + Runtime Analysis (axe-core)
  - Falls back gracefully to HTTP fetch when Playwright is not installed
  - Shows a tip to install Playwright for users who don't have it
- `axe-core` added as bundled dependency
- `playwright` supported as optional external dependency
- PT-BR translations for all new browser validation messages

---

## [1.4.1] — 2026-04-22

### Added

- **3 new WCAG 2.2 rules** expanding criteria coverage:
  - `focus_visible_01` — Detects removal of focus outline (`outline: none/0`) without alternative visible indicator (WCAG 2.4.7, Level AA)
  - `error_id_01` — Flags `aria-invalid="true"` without `aria-errormessage` or `aria-describedby` (WCAG 3.3.1, Level A)
  - `status_msg_01` — Warns when `role="status"` or `role="alert"` lacks explicit `aria-live` attribute (WCAG 4.1.3, Level AA)
- All 3 rules implemented for both HTML and JSX/TSX validators
- PT-BR translations for all new messages

---

## [1.4.0] — 2025-07-21

### Added

- **35 new accessibility rules** covering a broad range of AccessMonitor / WCAG checks:
  - **Images & Links:** `a_03` (image link without alt), `a_05` (redundant title), `a_02b` (multiple skip nav), `area_01b` (area without alt), `inp_img_01b` (input image without alt), `input_03` (alt on non-image input), `win_01` (javascript: URI)
  - **ARIA:** `aria_04` (invalid boolean/token ARIA values), `element_02` (focusable inside aria-hidden), `element_03` (focusable with aria-hidden), `element_09` (presentational role with focusable content)
  - **Forms:** `field_01` (fieldset without legend), `label_03` (aria-label doesn't contain visible text), `input_02` (alt on non-image input)
  - **Headings & Structure:** `hx_02` (heading with only images without alt), `br_01` (consecutive BR), `blink_02` (text-decoration: blink), `abbr_01` (abbr without title)
  - **Page-level:** `title_04` (title too short/long), `title_05` (control chars in title), `element_07` (invalid lang on elements), `meta_02` (immediate redirect), `meta_04` (delayed refresh)
  - **Landmarks:** `landmark_10` (duplicate top-level banner), `landmark_12` (duplicate top-level contentinfo)
  - **Tables:** `headers_02` (headers ref non-existent ID), `scope_01` (scope on td)
  - **Frames:** `frame_01` (frame without title), `iframe_02` (duplicate iframe titles), `iframe_04` (iframe with negative tabindex)
  - **Media:** `audio_video_02` (autoplay without muted)
  - **Events:** `ehandler_02` (ondblclick without keyboard handler)
  - **Lists:** `list_01` (invalid children of ul/ol), `list_03` (invalid children of dl)
  - **Objects:** `object_02` (object without accessible name)
- Shared ARIA validation constants: `ARIA_BOOLEAN_ATTRS`, `ARIA_TOKEN_VALUES`, `FOCUSABLE_SELECTORS`
- New HTML validator functions: `checkAccessibilityTree`, `checkStructure`
- Improved meta refresh detection: distinguishes immediate redirect (`meta_02`) from delayed refresh (`meta_04`)
- JSX validator extended with 6 new checks: `aria_04`, `element_03`, `inp_img_01b`, `object_02`, `audio_video_02`, `field_01`
- PT-BR translations for all new rule titles, descriptions, messages, and fixes

---

## [1.3.0] — 2025-07-21

### Added

- **Component mapping for React / library components** — define how custom components (e.g. `Button`, `Link`, `IconButton`) map to native HTML elements for accessibility validation via a `.a11y-mcp.json` configuration file
- New setting `a11y-mcp.configFile` to configure the path to the component-mapping file (default: `.a11y-mcp.json`)
- Config file watcher — automatically re-validates open files when the mapping file changes
- Example config file `.a11y-mcp.example.json` included in the repository
- PropMap support — map component-specific prop names to standard HTML attributes (e.g. `ariaLabel` → `aria-label`, `to` → `href`)

---

## [1.2.0] — 2025-04-22

### Added

- **QuickFix code actions** for common issues: missing `alt`, `lang`, `title`, `controls`; positive `tabindex`; viewport zoom restriction; non-semantic `<b>`/`<i>` markup
- **3 new accessibility rules:**
  - `table_06` — `<th>` missing `scope` attribute
  - `aria_03` — ARIA reference (`aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-owns`) pointing to non-existent ID
  - `a_10` — `<a target="_blank">` opens new window without warning the user (WCAG 3.2.5 AAA)
- **Incremental validation cache** — skips re-validation of unchanged files on save

### Fixed

- `wcagLevel` setting now properly filters diagnostics and MCP tool results by WCAG level (A ⊂ AA ⊂ AAA)
- `include`/`exclude` glob patterns from settings now control workspace file discovery (uses `vscode.workspace.findFiles`)
- Workspace scan no longer runs the validator twice per file (removed duplicate `validateContent` call)
- `checkIds` no longer flags the first occurrence of a duplicate ID — only subsequent duplicates are reported
- Missing `vscode.l10n.t()` wrapping on `a_06` and `a_09` link messages (broken pt-BR translations)
- Diagnostic range no longer uses unclamped line number when issue line exceeds document length

### Changed

- `validateUrlTool` now enforces a **10 MB response size limit** and caps redirect follows to 3
- Shared `VALID_ROLES`, `VALID_ARIA_ATTRS`, `NON_INTERACTIVE_TAGS`, `INTERACTIVE_ROLES`, and `REQUIRED_ARIA` constants moved to `rules.ts` (deduplicated from HTML and JSX validators)
- Workspace file collection uses `vscode.workspace.findFiles` instead of manual `fs.readdirSync` walk (respects `.gitignore` and VS Code settings)
- Stats computation uses a single pass instead of three `.filter()` calls

### Performance

- `checkAria` in HTML validator skips elements without `aria-*` attributes (avoids unnecessary processing on full DOM scan)
- `VALID_ROLES` set in JSX validator moved to module scope (no longer recreated per JSX element)
- Content hash-based cache in diagnostics provider avoids re-validation on unchanged files

---

## [0.1.0] — 2026-04-20

### Added

- Initial release
- **30+ accessibility rules** based on WCAG 2.2 (AAA) and the AccessMonitor ruleset
- HTML validator (cheerio-based) covering images, links, buttons, forms, headings, landmarks, tables, iframes, SVG, ARIA, IDs, meta tags, media, event handlers and obsolete elements
- JSX/TSX validator (@babel/parser-based) with JSX-specific checks for `onClick` on non-interactive elements
- Inline diagnostics in the VS Code Problems panel on open and save
- Three **GitHub Copilot MCP tools**:
  - `a11y_validate_file` — full report for a single file
  - `a11y_validate_workspace` — workspace-wide accessibility health summary
  - `a11y_get_rule` — detailed explanation of any rule with fix guidance
- Commands: `A11y: Validate Current File` and `A11y: Validate Workspace`
- Configurable WCAG level, include/exclude patterns via settings
