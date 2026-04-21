# Changelog

All notable changes to **A11y MCP** will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
