/**
 * Simulates the output of a11y_validate_url for demo/screenshot purposes.
 * Usage: node demo/simulate-output.js
 */
const fs = require("fs");
const path = require("path");

// We build the output format manually to simulate what the tool produces.

const url = "http://localhost:3000";
const html = fs.readFileSync(path.join(__dirname, "demo-page.html"), "utf-8");

// We'll build the output format that matches our formatBrowserResult
const lines = [];

lines.push(`## Accessibility Validation: ${url}`);
lines.push("");
lines.push("🌐 **Mode: Browser (Playwright + axe-core)** — Full runtime analysis");
lines.push("");

// ── Section 1: Static HTML Analysis
lines.push("### 📋 Static HTML Analysis (85 rules)");
lines.push("**Summary:** 18 issue(s) — 7 error(s), 9 warning(s), 2 notice(s)");
lines.push("");

lines.push("#### 🔴 Errors (7)");
lines.push("");
lines.push("**[img_01b]** Line 22: <img> is missing the required alt attribute.");
lines.push("- WCAG: 1.1.1 (Level A)");
lines.push("- Element: `<img src=\"produto1.jpg\">`");
lines.push("- Fix: Add a descriptive alt attribute to the image.");
lines.push("");
lines.push("**[button_02]** Line 34: <button> has no accessible name (no text, aria-label, or title).");
lines.push("- WCAG: 4.1.2 (Level A)");
lines.push("- Element: `<button></button>`");
lines.push("- Fix: Add text content, aria-label, or title to the button.");
lines.push("");
lines.push("**[input_01]** Line 38: input element has no associated label, aria-label, aria-labelledby, or title.");
lines.push("- WCAG: 1.3.1, 3.3.2 (Level A)");
lines.push("- Element: `<input type=\"text\" name=\"email\" placeholder=\"Seu email\">`");
lines.push("- Fix: Add a <label for=\"...\"> or aria-label to the input.");
lines.push("");
lines.push("**[input_01]** Line 39: input element has no associated label, aria-label, aria-labelledby, or title.");
lines.push("- WCAG: 1.3.1, 3.3.2 (Level A)");
lines.push("- Element: `<input type=\"text\" name=\"name\">`");
lines.push("- Fix: Add a <label for=\"...\"> or aria-label to the input.");
lines.push("");
lines.push("**[table_05a]** Line 43: <table> has no header cells (<th>). Data tables need headers.");
lines.push("- WCAG: 1.3.1 (Level A)");
lines.push("- Element: `<table><tr><td>Produto</td><td>Preço</td></tr>...`");
lines.push("- Fix: Use <th> for header cells and add scope attributes.");
lines.push("");
lines.push("**[lang_03]** Line 2: <html> has no lang attribute.");
lines.push("- WCAG: 3.1.1 (Level A)");
lines.push("- Element: `<html>`");
lines.push("- Fix: Add lang=\"pt-BR\" to the <html> element.");
lines.push("");
lines.push("**[iframe_01]** Line 48: <iframe> has no title attribute.");
lines.push("- WCAG: 2.4.1 (Level A)");
lines.push("- Element: `<iframe src=\"https://maps.google.com\">`");
lines.push("- Fix: Add a descriptive title attribute to the iframe.");
lines.push("");

lines.push("#### 🟡 Warnings (9)");
lines.push("");
lines.push("**[img_03]** Line 30: <img alt=\"foto.png\"> has an uninformative alt value.");
lines.push("- WCAG: 1.1.1 (Level A)");
lines.push("- Element: `<img src=\"produto2.jpg\" alt=\"foto.png\">`");
lines.push("- Fix: Replace with a meaningful description of the image content.");
lines.push("");
lines.push("**[heading_02]** Line 19: Heading level skipped: expected <h2> but found <h3>.");
lines.push("- WCAG: 1.3.1 (Level A)");
lines.push("- Element: `<h3>Produtos em destaque</h3>`");
lines.push("- Fix: Use sequential heading levels without skipping.");
lines.push("");
lines.push("**[meta_05]** Line 4: Viewport meta disables user zoom (maximum-scale=1.0, user-scalable=no).");
lines.push("- WCAG: 1.4.4 (Level AA)");
lines.push("- Element: `<meta name=\"viewport\" content=\"...maximum-scale=1.0, user-scalable=no\">`");
lines.push("- Fix: Remove maximum-scale and user-scalable=no restrictions.");
lines.push("");
lines.push("**[ehandler_04]** Line 25: <div> has onclick but no keyboard handler (onkeydown/onkeyup/onkeypress).");
lines.push("- WCAG: 2.1.1 (Level A)");
lines.push("- Element: `<div onclick=\"addToCart(1)\" style=\"outline: none; cursor: pointer;\">`");
lines.push("- Fix: Add onkeydown/onkeyup handler or use a <button> element.");
lines.push("");
lines.push("**[focus_visible_01]** Line 25: Element removes focus outline (outline: none/0) without providing an alternative visible focus indicator.");
lines.push("- WCAG: 2.4.7 (Level AA)");
lines.push("- Element: `<div onclick=\"addToCart(1)\" style=\"outline: none; cursor: pointer;\">`");
lines.push("- Fix: Do not remove the focus outline unless you provide an alternative visible focus indicator.");
lines.push("");
lines.push("**[autocomplete_01]** Line 38: Input \"email\" collects personal data but has no autocomplete attribute. Expected: autocomplete=\"email\".");
lines.push("- WCAG: 1.3.5 (Level AA)");
lines.push("- Element: `<input type=\"text\" name=\"email\" placeholder=\"Seu email\">`");
lines.push("- Fix: Add autocomplete=\"email\" to the input.");
lines.push("");
lines.push("**[autocomplete_01]** Line 39: Input \"name\" collects personal data but has no autocomplete attribute. Expected: autocomplete=\"name\".");
lines.push("- WCAG: 1.3.5 (Level AA)");
lines.push("- Element: `<input type=\"text\" name=\"name\">`");
lines.push("- Fix: Add autocomplete=\"name\" to the input.");
lines.push("");
lines.push("**[audio_video_01]** Line 50: <video> is missing the controls attribute.");
lines.push("- WCAG: 1.2.1 (Level A)");
lines.push("- Element: `<video src=\"promo.mp4\" autoplay>`");
lines.push("- Fix: Add the controls attribute to the media element.");
lines.push("");
lines.push("**[win_01]** Line 54: A link uses javascript: as its href value.");
lines.push("- WCAG: 2.1.1 (Level A)");
lines.push("- Element: `<a href=\"javascript:void(0)\">Voltar ao topo</a>`");
lines.push("- Fix: Replace javascript: URIs with proper href values and use event listeners.");
lines.push("");

lines.push("#### 🔵 Notices (2)");
lines.push("");
lines.push("**[status_msg_01]** Line 41: Element with role=\"alert\" has no explicit aria-live attribute. Add aria-live=\"assertive\" for broader assistive technology support.");
lines.push("- WCAG: 4.1.3 (Level AA)");
lines.push("- Element: `<div role=\"alert\">Preencha todos os campos</div>`");
lines.push("- Fix: Add aria-live=\"assertive\" for role=\"alert\".");
lines.push("");
lines.push("**[form_01b]** Line 37: form has no submit button.");
lines.push("- WCAG: 3.2.2 (Level A)");
lines.push("- Element: `<form>...</form>`");
lines.push("- Fix: Add a <button type=\"submit\"> or <input type=\"submit\"> to the form.");
lines.push("");

// ── Section 2: axe-core Runtime Analysis
lines.push("### 🔬 Runtime Analysis (axe-core)");
lines.push("**Summary:** 12 issue(s) — 5 error(s), 5 warning(s), 2 notice(s)");
lines.push("");

lines.push("#### 🔴 Errors (5)");
lines.push("");
lines.push("**[axe:color-contrast]** Elements must meet minimum color contrast ratio thresholds");
lines.push("- WCAG: 1.4.3 (Level AA)");
lines.push("- Element: `<p>R$ 49,90</p>`");
lines.push("- Fix: Element has insufficient color contrast of 2.8:1 (foreground: #999, background: #fff). Expected ratio: 4.5:1");
lines.push("- Reference: https://dequeuniversity.com/rules/axe/4.10/color-contrast");
lines.push("");
lines.push("**[axe:image-alt]** Images must have alternate text");
lines.push("- WCAG: 1.1.1 (Level A)");
lines.push("- Element: `<img src=\"produto1.jpg\">`");
lines.push("- Fix: Element does not have an alt attribute. Ensure images have alternate text.");
lines.push("- Reference: https://dequeuniversity.com/rules/axe/4.10/image-alt");
lines.push("");
lines.push("**[axe:label]** Form elements must have labels");
lines.push("- WCAG: 1.3.1 (Level A)");
lines.push("- Element: `<input type=\"text\" name=\"email\" placeholder=\"Seu email\">`");
lines.push("- Fix: Form element does not have an associated label.");
lines.push("- Reference: https://dequeuniversity.com/rules/axe/4.10/label");
lines.push("");
lines.push("**[axe:frame-title]** Frames must have an accessible name");
lines.push("- WCAG: 2.4.1 (Level A)");
lines.push("- Element: `<iframe src=\"https://maps.google.com\">`");
lines.push("- Fix: Element has no title attribute or aria-label.");
lines.push("- Reference: https://dequeuniversity.com/rules/axe/4.10/frame-title");
lines.push("");
lines.push("**[axe:button-name]** Buttons must have discernible text");
lines.push("- WCAG: 4.1.2 (Level A)");
lines.push("- Element: `<button></button>`");
lines.push("- Fix: Element does not have inner text or accessible name.");
lines.push("- Reference: https://dequeuniversity.com/rules/axe/4.10/button-name");
lines.push("");

lines.push("#### 🟡 Warnings (5)");
lines.push("");
lines.push("**[axe:meta-viewport]** Zooming and scaling must not be disabled");
lines.push("- WCAG: 1.4.4 (Level AA)");
lines.push("- Element: `<meta name=\"viewport\" content=\"...user-scalable=no\">`");
lines.push("- Fix: user-scalable=\"no\" is used in the <meta name=\"viewport\"> element or the maximum-scale is less than 5.");
lines.push("- Reference: https://dequeuniversity.com/rules/axe/4.10/meta-viewport");
lines.push("");
lines.push("**[axe:heading-order]** Heading levels should only increase by one");
lines.push("- WCAG: 1.3.1 (Level AA)");
lines.push("- Element: `<h3>Produtos em destaque</h3>`");
lines.push("- Fix: Heading order is invalid. Expected h2, found h3.");
lines.push("- Reference: https://dequeuniversity.com/rules/axe/4.10/heading-order");
lines.push("");
lines.push("**[axe:link-in-text-block]** Links must be distinguishable without relying on color");
lines.push("- WCAG: 1.4.1 (Level A)");
lines.push("- Element: `<a href=\"/produtos\">Produtos</a>`");
lines.push("- Fix: Links within text blocks must have a non-color visual distinction (underline, border, etc.).");
lines.push("- Reference: https://dequeuniversity.com/rules/axe/4.10/link-in-text-block");
lines.push("");
lines.push("**[axe:autocomplete-valid]** autocomplete attribute must be used correctly");
lines.push("- WCAG: 1.3.5 (Level AA)");
lines.push("- Element: `<input type=\"text\" name=\"email\" placeholder=\"Seu email\">`");
lines.push("- Fix: The autocomplete attribute is missing on an input that accepts personal data.");
lines.push("- Reference: https://dequeuniversity.com/rules/axe/4.10/autocomplete-valid");
lines.push("");
lines.push("**[axe:no-autoplay-audio]** <video> or <audio> elements must not play automatically");
lines.push("- WCAG: 1.4.2 (Level A)");
lines.push("- Element: `<video src=\"promo.mp4\" autoplay>`");
lines.push("- Fix: Ensure media elements with autoplay have mechanisms to pause or stop.");
lines.push("- Reference: https://dequeuniversity.com/rules/axe/4.10/no-autoplay-audio");
lines.push("");

lines.push("#### 🔵 Notices (2)");
lines.push("");
lines.push("**[axe:region]** All page content should be contained by landmarks");
lines.push("- WCAG: 1.3.1 (Level A)");
lines.push("- Element: `<footer><a href=\"javascript:void(0)\">Voltar ao topo</a></footer>`");
lines.push("- Fix: Some page content is not contained by a landmark region (header, nav, main, footer, etc.).");
lines.push("- Reference: https://dequeuniversity.com/rules/axe/4.10/region");
lines.push("");
lines.push("**[axe:landmark-unique]** Landmarks should have a unique role or accessible name");
lines.push("- WCAG: 1.3.1 (Level A)");
lines.push("- Element: `<nav>...</nav>`");
lines.push("- Fix: Multiple navigation landmarks detected. Add unique aria-label to each.");
lines.push("- Reference: https://dequeuniversity.com/rules/axe/4.10/landmark-unique");
lines.push("");

// ── Combined totals
lines.push("---");
lines.push("**Total combined:** 30 issue(s) — 12 error(s), 14 warning(s), 4 notice(s)");

console.log(lines.join("\n"));
