import * as vscode from "vscode";
import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";
import type { A11yIssue, ValidationResult } from "./types";
import {
  RULES,
  VALID_ROLES,
  VALID_ARIA_ATTRS,
  REQUIRED_ARIA,
  NON_INTERACTIVE_TAGS,
  INTERACTIVE_ROLES,
  ARIA_BOOLEAN_ATTRS,
  ARIA_TOKEN_VALUES,
  FOCUSABLE_SELECTORS,
} from "./rules";
import { computeStats } from "../utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Minimal CSS identifier escaping for use in cheerio selectors. */
function cssEscape(value: string): string {
  return value.replace(/([!"#$%&'()*+,./;<=>?@[\\\]^`{|}~])/g, "\\$1");
}

/** Attempt to get the source line/column from a cheerio/parse5 node. */
function getLocation(el: AnyNode): { line: number; column: number } {
  const loc = (el as any).sourceCodeLocation as
    | { startLine?: number; startCol?: number }
    | undefined;
  if (loc?.startLine) {
    return { line: loc.startLine, column: loc.startCol ?? 1 };
  }
  return { line: 1, column: 1 };
}

/** Fallback: find the first occurrence of a string inside source HTML. */
function findLineInSource(html: string, snippet: string): number {
  const trimmed = snippet.trimStart().substring(0, 60);
  const idx = html.indexOf(trimmed);
  if (idx === -1) return 1;
  return html.substring(0, idx).split("\n").length;
}

/** Build a simple CSS-like selector hint for an element. */
function buildSelector($el: cheerio.Cheerio<Element>): string {
  const tag = $el.prop("tagName")?.toLowerCase() ?? "element";
  const id = $el.attr("id");
  const cls = $el
    .attr("class")
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(".");
  return `${tag}${id ? `#${id}` : ""}${cls ? `.${cls}` : ""}`;
}

/** Return the accessible name of an element: text content, aria-label, or title. */
function getAccessibleName($: cheerio.CheerioAPI, el: Element): string {
  const $el = $(el);
  const ariaLabel = $el.attr("aria-label")?.trim() ?? "";
  if (ariaLabel) return ariaLabel;
  const ariaLabelledBy = $el.attr("aria-labelledby")?.trim() ?? "";
  if (ariaLabelledBy) {
    const names = ariaLabelledBy
      .split(/\s+/)
      .map((id) => $(`#${id}`).text().trim())
      .filter(Boolean);
    if (names.length) return names.join(" ");
  }
  const title = $el.attr("title")?.trim() ?? "";
  if (title) return title;
  return $el.text().trim();
}

/** Truncate outer HTML to 120 chars. */
function snippet($: cheerio.CheerioAPI, el: AnyNode): string {
  return ($.html(el) ?? "").substring(0, 120);
}

function makeIssue(
  ruleId: string,
  message: string,
  el: Element,
  $: cheerio.CheerioAPI,
  html: string,
): A11yIssue {
  const rule = RULES[ruleId];
  const loc = getLocation(el);
  const line = loc.line > 1 ? loc.line : findLineInSource(html, snippet($, el));
  return {
    ruleId,
    severity: rule.severity,
    wcagCriteria: rule.wcagCriteria,
    wcagLevel: rule.wcagLevel,
    message,
    element: snippet($, el),
    selector: buildSelector($(el)),
    line,
    column: loc.column,
    fix: rule.fix,
    helpUrl: rule.helpUrl,
  };
}

// ─── Rule checkers ────────────────────────────────────────────────────────────

function checkImages(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  const BAD_ALT =
    /^(image|img|photo|foto|picture|pic|icon|graphic|banner|logo|\.(?:png|jpg|jpeg|gif|svg|webp|bmp))$/i;

  // Missing alt
  $("img:not([alt])").each((_, el) => {
    issues.push(
      makeIssue(
        "img_01b",
        vscode.l10n.t("img element is missing the required alt attribute."),
        el as Element,
        $,
        html,
      ),
    );
  });

  // Inappropriate alt text
  $("img[alt]").each((_, el) => {
    const $el = $(el);
    const alt = ($el.attr("alt") ?? "").trim();
    if (alt === "") return; // Decorative — handled below
    if (BAD_ALT.test(alt) || /\.(png|jpe?g|gif|svg|webp|bmp)$/i.test(alt)) {
      issues.push(
        makeIssue(
          "img_03",
          vscode.l10n.t(
            'img alt="{0}" is a filename or uninformative word. Describe the image meaning.',
            alt,
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
    if (alt.length > 100) {
      issues.push(
        makeIssue(
          "img_04",
          vscode.l10n.t(
            "img alt text is {0} characters long (max recommended: 100).",
            alt.length,
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });

  // Decorative images not hidden
  $('img[alt=""]').each((_, el) => {
    const $el = $(el);
    const role = $el.attr("role") ?? "";
    const hidden = $el.attr("aria-hidden") ?? "";
    if (role !== "presentation" && role !== "none" && hidden !== "true") {
      issues.push(
        makeIssue(
          "img_02",
          vscode.l10n.t(
            'Decorative img (alt="") should also have role="presentation" or aria-hidden="true".',
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });

  // Image link with empty/missing alt (a_03)
  $("a").each((_, el) => {
    const $a = $(el);
    const imgs = $a.find("img");
    if (imgs.length === 0) return;
    // Only flag if link contains ONLY images (no text content)
    const textContent = $a
      .contents()
      .toArray()
      .filter((n) => n.type === "text")
      .map((n) => (n as any).data?.trim() ?? "")
      .join("");
    if (textContent) return;
    const ariaLabel = ($a.attr("aria-label") ?? "").trim();
    const ariaLabelledBy = ($a.attr("aria-labelledby") ?? "").trim();
    const title = ($a.attr("title") ?? "").trim();
    if (ariaLabel || ariaLabelledBy || title) return;

    imgs.each((_, img) => {
      const alt = $(img).attr("alt");
      if (alt === undefined || alt.trim() === "") {
        issues.push(
          makeIssue(
            "a_03",
            vscode.l10n.t(
              "Link contains only an image with empty or missing alt text. The link has no accessible name.",
            ),
            el as Element,
            $,
            html,
          ),
        );
      }
    });
  });

  // Image map area without alt (area_01b)
  $("area:not([alt]), area[alt='']").each((_, el) => {
    issues.push(
      makeIssue(
        "area_01b",
        vscode.l10n.t("<area> element in image map has no alt attribute."),
        el as Element,
        $,
        html,
      ),
    );
  });

  // Input type="image" without alt (inp_img_01b)
  $('input[type="image"]:not([alt]), input[type="image"][alt=""]').each(
    (_, el) => {
      issues.push(
        makeIssue(
          "inp_img_01b",
          vscode.l10n.t('<input type="image"> has no alt attribute.'),
          el as Element,
          $,
          html,
        ),
      );
    },
  );
}

function checkLinks(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  // Missing accessible name
  $("a").each((_, el) => {
    const name = getAccessibleName($, el as Element);
    if (!name) {
      issues.push(
        makeIssue(
          "a_11",
          vscode.l10n.t(
            "Anchor element has no accessible name (no text, aria-label, aria-labelledby, or title).",
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });

  // Adjacent identical links to the same URL
  const anchors = $("a[href]").toArray() as Element[];
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    const hrefA = $(a).attr("href") ?? "";
    const hrefB = $(b).attr("href") ?? "";
    const nameA = getAccessibleName($, a);
    const nameB = getAccessibleName($, b);
    if (hrefA && hrefA === hrefB && nameA && nameA === nameB) {
      issues.push(
        makeIssue(
          "a_06",
          vscode.l10n.t(
            'Adjacent links with identical accessible name "{0}" pointing to the same URL "{1}". Combine into one link.',
            nameA,
            hrefA,
          ),
          a,
          $,
          html,
        ),
      );
    }
  }

  // Identical text, different URLs
  const byName = new Map<string, { href: string; el: Element }[]>();
  anchors.forEach((a) => {
    const name = getAccessibleName($, a).toLowerCase();
    const href = $(a).attr("href") ?? "";
    if (!name || !href) return;
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name)!.push({ href, el: a });
  });
  for (const [name, entries] of byName) {
    const uniqueHrefs = new Set(entries.map((e) => e.href));
    if (uniqueHrefs.size > 1) {
      entries.forEach(({ el }) => {
        issues.push(
          makeIssue(
            "a_09",
            vscode.l10n.t(
              'Link with accessible name "{0}" points to different URLs elsewhere on the page.',
              name,
            ),
            el,
            $,
            html,
          ),
        );
      });
    }
  }

  // Links opening new window without warning
  $('a[target="_blank"]').each((_, el) => {
    const name = getAccessibleName($, el as Element);
    const hasWarning =
      /new (window|tab)/i.test(name) || /nova (janela|aba)/i.test(name);
    if (!hasWarning) {
      issues.push(
        makeIssue(
          "a_10",
          vscode.l10n.t(
            'Link with target="_blank" opens in a new window but does not warn the user.',
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });

  // Redundant link title (a_05)
  $("a[title]").each((_, el) => {
    const $a = $(el);
    const titleVal = ($a.attr("title") ?? "").trim().toLowerCase();
    const textVal = $a.text().trim().toLowerCase();
    if (titleVal && textVal && titleVal === textVal) {
      issues.push(
        makeIssue(
          "a_05",
          vscode.l10n.t(
            "Link title attribute duplicates the link text. Remove the redundant title.",
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });

  // javascript: URI (win_01)
  $('a[href^="javascript:"]').each((_, el) => {
    issues.push(
      makeIssue(
        "win_01",
        vscode.l10n.t(
          'Link uses "javascript:" URI. Use a <button> or proper event handler instead.',
        ),
        el as Element,
        $,
        html,
      ),
    );
  });
}

function checkButtons(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  $("button").each((_, el) => {
    const name = getAccessibleName($, el as Element);
    if (!name) {
      issues.push(
        makeIssue(
          "button_02",
          vscode.l10n.t("button element has no accessible name."),
          el as Element,
          $,
          html,
        ),
      );
    }
  });
}

function checkForms(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  const PERSONAL_INPUT_TYPES = new Set([
    "text",
    "email",
    "tel",
    "password",
    "url",
    "number",
    "search",
    "date",
    "month",
    "week",
    "datetime-local",
  ]);
  const AUTOCOMPLETE_HINTS: Record<string, string> = {
    name: "name",
    email: "email",
    tel: "tel",
    phone: "tel",
    address: "street-address",
    zip: "postal-code",
    "postal-code": "postal-code",
    city: "address-level2",
    country: "country",
    "first-name": "given-name",
    "last-name": "family-name",
    "cc-number": "cc-number",
    card: "cc-number",
    username: "username",
    password: "current-password",
  };

  $("input, select, textarea").each((_, el) => {
    const $el = $(el);
    const type = ($el.attr("type") ?? "text").toLowerCase();
    if (
      type === "hidden" ||
      type === "submit" ||
      type === "reset" ||
      type === "button" ||
      type === "image"
    )
      return;

    const id = $el.attr("id") ?? "";
    const hasLabel = id ? $(`label[for="${id}"]`).length > 0 : false;
    const ariaLabel = ($el.attr("aria-label") ?? "").trim();
    const ariaLabelledBy = ($el.attr("aria-labelledby") ?? "").trim();
    const title = ($el.attr("title") ?? "").trim();

    if (!hasLabel && !ariaLabel && !ariaLabelledBy && !title) {
      issues.push(
        makeIssue(
          "input_01",
          vscode.l10n.t(
            "{0} element has no associated label, aria-label, aria-labelledby, or title.",
            el.name,
          ),
          el as Element,
          $,
          html,
        ),
      );
    }

    // autocomplete hint for personal data inputs
    if (PERSONAL_INPUT_TYPES.has(type) && !$el.attr("autocomplete")) {
      const name = ($el.attr("name") ?? $el.attr("id") ?? "").toLowerCase();
      const expectedToken = Object.entries(AUTOCOMPLETE_HINTS).find(([k]) =>
        name.includes(k),
      )?.[1];
      if (expectedToken) {
        issues.push(
          makeIssue(
            "autocomplete_01",
            vscode.l10n.t(
              'Input "{0}" collects personal data but has no autocomplete attribute. Expected: autocomplete="{1}".',
              name,
              expectedToken,
            ),
            el as Element,
            $,
            html,
          ),
        );
      }
    }
  });

  // Label whose for= references a non-existent control
  $("label[for]").each((_, el) => {
    const forVal = ($(el).attr("for") ?? "").trim();
    if (!forVal) {
      issues.push(
        makeIssue(
          "label_02",
          vscode.l10n.t("label has an empty for attribute."),
          el as Element,
          $,
          html,
        ),
      );
    } else if ($(`#${cssEscape(forVal)}`).length === 0) {
      issues.push(
        makeIssue(
          "label_02",
          vscode.l10n.t(
            'label for="{0}" does not reference any element with that id.',
            forVal,
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });

  // Missing submit button in forms
  $("form").each((_, el) => {
    const $form = $(el);
    const hasSubmit =
      $form.find('button[type="submit"], button:not([type])').length > 0 ||
      $form.find('input[type="submit"], input[type="image"]').length > 0;
    if (!hasSubmit) {
      issues.push(
        makeIssue(
          "form_01b",
          vscode.l10n.t("form has no submit button."),
          el as Element,
          $,
          html,
        ),
      );
    }
  });

  // Inappropriate alt on non-image input (input_03)
  $("input[alt]").each((_, el) => {
    const type = ($(el).attr("type") ?? "text").toLowerCase();
    if (type !== "image") {
      issues.push(
        makeIssue(
          "input_03",
          vscode.l10n.t(
            '<input type="{0}"> has an alt attribute. alt is only valid on <input type="image">.',
            type,
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });

  // Label aria-label doesn't contain visible label text (label_03)
  $("input[aria-label], select[aria-label], textarea[aria-label]").each(
    (_, el) => {
      const $el = $(el);
      const ariaLabel = ($el.attr("aria-label") ?? "").trim().toLowerCase();
      if (!ariaLabel) return;
      const id = ($el.attr("id") ?? "").trim();
      if (!id) return;
      const $label = $(`label[for="${cssEscape(id)}"]`);
      if ($label.length === 0) return;
      const visibleText = $label.text().trim().toLowerCase();
      if (visibleText && !ariaLabel.includes(visibleText)) {
        issues.push(
          makeIssue(
            "label_03",
            vscode.l10n.t(
              'aria-label "{0}" does not contain the visible label text "{1}". Speech-input users may fail to activate this control.',
              $el.attr("aria-label")!,
              $label.text().trim(),
            ),
            el as Element,
            $,
            html,
          ),
        );
      }
    },
  );

  // Fieldset without legend (field_01)
  $("fieldset").each((_, el) => {
    const $fieldset = $(el);
    const hasLegend = $fieldset.children("legend").length > 0;
    if (!hasLegend) {
      issues.push(
        makeIssue(
          "field_01",
          vscode.l10n.t("<fieldset> has no <legend> element."),
          el as Element,
          $,
          html,
        ),
      );
    }
  });
}

function checkHeadings(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  const headings = $("h1,h2,h3,h4,h5,h6").toArray() as Element[];

  // No headings at all
  if (headings.length === 0) {
    // Only flag if the page has significant body text
    const bodyText = $("body").text().trim();
    if (bodyText.length > 200) {
      issues.push({
        ruleId: "hx_01a",
        severity: RULES.hx_01a.severity,
        wcagCriteria: RULES.hx_01a.wcagCriteria,
        wcagLevel: RULES.hx_01a.wcagLevel,
        message:
          "Page has significant text content but no heading elements (h1–h6).",
        element: "<body>",
        selector: "body",
        line: 1,
        column: 1,
        fix: RULES.hx_01a.fix,
        helpUrl: RULES.hx_01a.helpUrl,
      });
    }
    return;
  }

  // No h1
  const h1s = $("h1").toArray() as Element[];
  if (h1s.length === 0) {
    issues.push({
      ruleId: "hx_01c",
      severity: RULES.hx_01c.severity,
      wcagCriteria: RULES.hx_01c.wcagCriteria,
      wcagLevel: RULES.hx_01c.wcagLevel,
      message: vscode.l10n.t("Page has no <h1> element."),
      element: "<body>",
      selector: "body",
      line: 1,
      column: 1,
      fix: RULES.hx_01c.fix,
      helpUrl: RULES.hx_01c.helpUrl,
    });
  }

  // Multiple h1
  if (h1s.length > 1) {
    h1s.slice(1).forEach((el) => {
      issues.push(
        makeIssue(
          "heading_04",
          vscode.l10n.t(
            "Page has {0} <h1> elements. Only one is allowed.",
            h1s.length,
          ),
          el,
          $,
          html,
        ),
      );
    });
  }

  // Empty headings
  headings.forEach((el) => {
    if (!getAccessibleName($, el)) {
      issues.push(
        makeIssue(
          "heading_02",
          vscode.l10n.t("<{0}> element is empty.", el.name),
          el,
          $,
          html,
        ),
      );
    }
  });

  // Heading with only non-text content (images without alt) — hx_02
  headings.forEach((el) => {
    const $h = $(el);
    const text = $h.text().trim();
    if (text) return; // Has text content — OK
    const ariaLabel = ($h.attr("aria-label") ?? "").trim();
    if (ariaLabel) return;
    const imgs = $h.find("img");
    if (imgs.length === 0) return; // Empty heading already caught by heading_02
    // Has images but no text — check if any img has alt
    const hasAltOnImg = imgs.toArray().some((img) => {
      const alt = $(img).attr("alt")?.trim();
      return alt !== undefined && alt !== "";
    });
    if (!hasAltOnImg) {
      issues.push(
        makeIssue(
          "hx_02",
          vscode.l10n.t(
            "<{0}> contains only image(s) without alt text. The heading has no accessible name.",
            el.name,
          ),
          el,
          $,
          html,
        ),
      );
    }
  });

  // Skipped heading levels
  let prevLevel = 0;
  headings.forEach((el) => {
    const level = parseInt(el.name[1], 10);
    if (prevLevel > 0 && level > prevLevel + 1) {
      issues.push(
        makeIssue(
          "hx_03",
          vscode.l10n.t(
            "Heading level skipped: <h{0}> followed by <h{1}>.",
            prevLevel,
            level,
          ),
          el,
          $,
          html,
        ),
      );
    }
    prevLevel = level;
  });
}

function checkPage(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  const isFullDocument = $("html").length > 0;
  if (!isFullDocument) return;

  // Title
  const $title = $("title");
  if ($title.length === 0) {
    issues.push({
      ruleId: "title_02",
      severity: RULES.title_02.severity,
      wcagCriteria: RULES.title_02.wcagCriteria,
      wcagLevel: RULES.title_02.wcagLevel,
      message: vscode.l10n.t("Page is missing a <title> element."),
      element: "<head>",
      selector: "head",
      line: 1,
      column: 1,
      fix: RULES.title_02.fix,
      helpUrl: RULES.title_02.helpUrl,
    });
  } else if (!$title.text().trim()) {
    issues.push({
      ruleId: "title_03",
      severity: RULES.title_03.severity,
      wcagCriteria: RULES.title_03.wcagCriteria,
      wcagLevel: RULES.title_03.wcagLevel,
      message: vscode.l10n.t("<title> element is empty."),
      element: $.html($title) ?? "<title></title>",
      selector: "title",
      line: findLineInSource(html, "<title"),
      column: 1,
      fix: RULES.title_03.fix,
      helpUrl: RULES.title_03.helpUrl,
    });
  } else {
    const titleText = $title.text().trim();
    // Title too short or too long (title_04)
    if (titleText.length < 2 || titleText.length > 150) {
      issues.push({
        ruleId: "title_04",
        severity: RULES.title_04.severity,
        wcagCriteria: RULES.title_04.wcagCriteria,
        wcagLevel: RULES.title_04.wcagLevel,
        message: vscode.l10n.t(
          "<title> is {0} characters long. Recommended: 2–150 characters.",
          titleText.length,
        ),
        element: $.html($title) ?? "<title></title>",
        selector: "title",
        line: findLineInSource(html, "<title"),
        column: 1,
        fix: RULES.title_04.fix,
        helpUrl: RULES.title_04.helpUrl,
      });
    }
    // Title with special/control characters (title_05)
    if (/[\x00-\x1F\x7F]/.test(titleText) || /^[^\w\s]+$/.test(titleText)) {
      issues.push({
        ruleId: "title_05",
        severity: RULES.title_05.severity,
        wcagCriteria: RULES.title_05.wcagCriteria,
        wcagLevel: RULES.title_05.wcagLevel,
        message: vscode.l10n.t(
          "<title> contains control characters or non-descriptive content.",
        ),
        element: $.html($title) ?? "<title></title>",
        selector: "title",
        line: findLineInSource(html, "<title"),
        column: 1,
        fix: RULES.title_05.fix,
        helpUrl: RULES.title_05.helpUrl,
      });
    }
  }

  // Language
  const $html = $("html");
  const lang = $html.attr("lang")?.trim();
  if (!lang) {
    issues.push({
      ruleId: "lang_03",
      severity: RULES.lang_03.severity,
      wcagCriteria: RULES.lang_03.wcagCriteria,
      wcagLevel: RULES.lang_03.wcagLevel,
      message: vscode.l10n.t("<html> element is missing the lang attribute."),
      element: snippet($, $html[0] as Element),
      selector: "html",
      line: 1,
      column: 1,
      fix: RULES.lang_03.fix,
      helpUrl: RULES.lang_03.helpUrl,
    });
  } else if (!/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{1,8})*$/.test(lang)) {
    issues.push({
      ruleId: "lang_02",
      severity: RULES.lang_02.severity,
      wcagCriteria: RULES.lang_02.wcagCriteria,
      wcagLevel: RULES.lang_02.wcagLevel,
      message: vscode.l10n.t(
        '<html lang="{0}"> is not a valid BCP 47 language tag.',
        lang,
      ),
      element: snippet($, $html[0] as Element),
      selector: "html",
      line: 1,
      column: 1,
      fix: RULES.lang_02.fix,
      helpUrl: RULES.lang_02.helpUrl,
    });
  }

  // Invalid lang on internal elements (element_07)
  $("[lang]").each((_, el) => {
    if ((el as Element).name === "html") return;
    const elLang = ($(el).attr("lang") ?? "").trim();
    if (elLang && !/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{1,8})*$/.test(elLang)) {
      issues.push(
        makeIssue(
          "element_07",
          vscode.l10n.t(
            '<{0} lang="{1}"> has an invalid BCP 47 language tag.',
            (el as Element).name,
            elLang,
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });
}

function checkLandmarks(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  if ($("html").length === 0) return; // fragments

  const mainCount = $('main, [role="main"]').length;
  if (mainCount === 0) {
    issues.push({
      ruleId: "landmark_07",
      severity: RULES.landmark_07.severity,
      wcagCriteria: RULES.landmark_07.wcagCriteria,
      wcagLevel: RULES.landmark_07.wcagLevel,
      message: vscode.l10n.t("Page has no <main> landmark."),
      element: "<body>",
      selector: "body",
      line: 1,
      column: 1,
      fix: RULES.landmark_07.fix,
      helpUrl: RULES.landmark_07.helpUrl,
    });
  } else if (mainCount > 1) {
    $('main, [role="main"]')
      .toArray()
      .slice(1)
      .forEach((el) => {
        issues.push(
          makeIssue(
            "landmark_14",
            vscode.l10n.t(
              'Page has {0} <main> / role="main" elements. Only one is allowed.',
              mainCount,
            ),
            el as Element,
            $,
            html,
          ),
        );
      });
  }

  // Skip navigation
  const firstFocusable = $(
    "a[href], button, input, select, textarea, [tabindex]",
  ).first();
  if (firstFocusable.length) {
    const href = (firstFocusable.attr("href") ?? "").trim();
    const isSkipLink = href.startsWith("#") && firstFocusable.is("a");
    if (!isSkipLink) {
      issues.push({
        ruleId: "a_02a",
        severity: RULES.a_02a.severity,
        wcagCriteria: RULES.a_02a.wcagCriteria,
        wcagLevel: RULES.a_02a.wcagLevel,
        message: vscode.l10n.t(
          "The first focusable element on the page is not a skip navigation link.",
        ),
        element: snippet($, firstFocusable[0] as Element),
        selector: buildSelector(firstFocusable),
        line: getLocation(firstFocusable[0] as AnyNode).line,
        column: 1,
        fix: RULES.a_02a.fix,
        helpUrl: RULES.a_02a.helpUrl,
      });
    }
  }

  // Multiple skip navigation links (a_02b)
  const skipLinks = $('a[href^="#"]')
    .toArray()
    .filter((el) => {
      const text = getAccessibleName($, el as Element).toLowerCase();
      return (
        /skip|pular|ir para/i.test(text) ||
        ($(el).attr("href") ?? "").match(/^#(main|content|conteudo)/i)
      );
    });
  if (skipLinks.length > 1) {
    skipLinks.slice(1).forEach((el) => {
      issues.push(
        makeIssue(
          "a_02b",
          vscode.l10n.t(
            "Page has {0} skip navigation links. Typically one is sufficient.",
            skipLinks.length,
          ),
          el as Element,
          $,
          html,
        ),
      );
    });
  }

  // Duplicate banner landmarks (landmark_10)
  const banners = $('header, [role="banner"]')
    .toArray()
    .filter((el) => {
      // Only top-level banners (direct child of body or not nested in sectioning elements)
      const parent = (el as Element).parent as Element | null;
      return (
        !parent || parent.name === "body" || parent.type === ("root" as any)
      );
    }) as Element[];
  if (banners.length > 1) {
    banners.slice(1).forEach((el) => {
      issues.push(
        makeIssue(
          "landmark_10",
          vscode.l10n.t(
            "Page has {0} top-level banner landmarks. Only one is allowed.",
            banners.length,
          ),
          el,
          $,
          html,
        ),
      );
    });
  }

  // Duplicate contentinfo landmarks (landmark_12)
  const contentinfos = $('footer, [role="contentinfo"]')
    .toArray()
    .filter((el) => {
      const parent = (el as Element).parent as Element | null;
      return (
        !parent || parent.name === "body" || parent.type === ("root" as any)
      );
    }) as Element[];
  if (contentinfos.length > 1) {
    contentinfos.slice(1).forEach((el) => {
      issues.push(
        makeIssue(
          "landmark_12",
          vscode.l10n.t(
            "Page has {0} top-level contentinfo landmarks. Only one is allowed.",
            contentinfos.length,
          ),
          el,
          $,
          html,
        ),
      );
    });
  }
}

function checkTables(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  $("table").each((_, el) => {
    const $table = $(el);
    const hasTh = $table.find("th").length > 0;
    const hasCaption = $table.find("caption").length > 0;
    const isLayout =
      $table.attr("role") === "presentation" || $table.attr("role") === "none";
    if (isLayout) return;

    if (!hasTh) {
      issues.push(
        makeIssue(
          "table_05a",
          vscode.l10n.t("Data table has no <th> header cells."),
          el as Element,
          $,
          html,
        ),
      );
    }
    if (!hasCaption) {
      issues.push(
        makeIssue(
          "table_02",
          vscode.l10n.t("Data table has no <caption> element."),
          el as Element,
          $,
          html,
        ),
      );
    }

    // Nested tables
    $table.find("table").each((_, nested) => {
      issues.push(
        makeIssue(
          "table_04",
          vscode.l10n.t("Table nested inside another table."),
          nested as Element,
          $,
          html,
        ),
      );
    });

    // th without scope
    $table.find("th:not([scope])").each((_, th) => {
      issues.push(
        makeIssue(
          "table_06",
          vscode.l10n.t("<th> element is missing a scope attribute."),
          th as Element,
          $,
          html,
        ),
      );
    });

    // headers attribute referencing non-existent ID (headers_02)
    $table.find("td[headers], th[headers]").each((_, cell) => {
      const headerIds = ($(cell).attr("headers") ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      for (const hid of headerIds) {
        if ($table.find(`#${cssEscape(hid)}`).length === 0) {
          issues.push(
            makeIssue(
              "headers_02",
              vscode.l10n.t(
                'headers attribute references id="{0}" which does not exist in this table.',
                hid,
              ),
              cell as Element,
              $,
              html,
            ),
          );
        }
      }
    });

    // scope on non-th element (scope_01)
    $table.find("td[scope]").each((_, td) => {
      issues.push(
        makeIssue(
          "scope_01",
          vscode.l10n.t(
            "<td> has a scope attribute. scope is only meaningful on <th> elements.",
          ),
          td as Element,
          $,
          html,
        ),
      );
    });
  });
}

function checkFrames(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  $('iframe:not([title]), iframe[title=""]').each((_, el) => {
    issues.push(
      makeIssue(
        "iframe_01",
        vscode.l10n.t("iframe element has no title attribute."),
        el as Element,
        $,
        html,
      ),
    );
  });

  // frame without title (frame_01)
  $('frame:not([title]), frame[title=""]').each((_, el) => {
    issues.push(
      makeIssue(
        "frame_01",
        vscode.l10n.t("frame element has no title attribute."),
        el as Element,
        $,
        html,
      ),
    );
  });

  // Iframes with identical accessible names (iframe_02)
  const iframeTitles = new Map<string, Element[]>();
  $("iframe[title]").each((_, el) => {
    const title = ($(el).attr("title") ?? "").trim().toLowerCase();
    if (!title) return;
    if (!iframeTitles.has(title)) iframeTitles.set(title, []);
    iframeTitles.get(title)!.push(el as Element);
  });
  for (const [title, elements] of iframeTitles) {
    if (elements.length > 1) {
      elements.slice(1).forEach((el) => {
        issues.push(
          makeIssue(
            "iframe_02",
            vscode.l10n.t(
              'Multiple iframes share the same title "{0}". Give each a unique title.',
              title,
            ),
            el,
            $,
            html,
          ),
        );
      });
    }
  }

  // Iframe with negative tabindex (iframe_04)
  $("iframe[tabindex]").each((_, el) => {
    const val = parseInt($(el).attr("tabindex") ?? "0", 10);
    if (val < 0) {
      issues.push(
        makeIssue(
          "iframe_04",
          vscode.l10n.t(
            'iframe has tabindex="{0}" which prevents keyboard access.',
            val,
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });
}

function checkSvg(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  $("svg").each((_, el) => {
    const $svg = $(el);
    const isHidden = $svg.attr("aria-hidden") === "true";
    const role = $svg.attr("role") ?? "";
    if (isHidden || role === "presentation" || role === "none") return;
    const ariaLabel = $svg.attr("aria-label")?.trim() ?? "";
    const ariaLabelledBy = $svg.attr("aria-labelledby")?.trim() ?? "";
    const hasTitle = $svg.children("title").length > 0;
    if (!ariaLabel && !ariaLabelledBy && !hasTitle) {
      issues.push(
        makeIssue(
          "svg_02",
          vscode.l10n.t(
            "svg element has no accessible name (no <title>, aria-label, or aria-labelledby).",
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });
}

function checkAria(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  $("[role]").each((_, el) => {
    const roles = ($(el).attr("role") ?? "").trim().split(/\s+/);
    for (const role of roles) {
      if (!VALID_ROLES.has(role)) {
        issues.push(
          makeIssue(
            "aria_01",
            vscode.l10n.t('role="{0}" is not a valid WAI-ARIA role.', role),
            el as Element,
            $,
            html,
          ),
        );
      }
      const required = REQUIRED_ARIA[role];
      if (required) {
        for (const req of required) {
          if (!$(el).attr(req)) {
            issues.push(
              makeIssue(
                "aria_02",
                vscode.l10n.t(
                  'role="{0}" requires the "{1}" attribute.',
                  role,
                  req,
                ),
                el as Element,
                $,
                html,
              ),
            );
          }
        }
      }
    }
  });

  // Unknown aria-* attributes — skip elements without any aria-* attrs
  $("*").each((_, el) => {
    const attribs = (el as Element).attribs ?? {};
    const ariaAttrs = Object.keys(attribs).filter((a) => a.startsWith("aria-"));
    if (ariaAttrs.length === 0) return;
    for (const attr of ariaAttrs) {
      if (!VALID_ARIA_ATTRS.has(attr)) {
        issues.push(
          makeIssue(
            "aria_07",
            vscode.l10n.t("Unknown ARIA attribute: {0}.", attr),
            el as Element,
            $,
            html,
          ),
        );
      }

      // Invalid ARIA boolean/token values (aria_04)
      const val = (attribs[attr] ?? "").trim().toLowerCase();
      if (!val) continue;
      if (ARIA_BOOLEAN_ATTRS.has(attr)) {
        if (val !== "true" && val !== "false") {
          issues.push(
            makeIssue(
              "aria_04",
              vscode.l10n.t(
                '{0}="{1}" is not valid. Expected "true" or "false".',
                attr,
                attribs[attr],
              ),
              el as Element,
              $,
              html,
            ),
          );
        }
      }
      const tokenSet = ARIA_TOKEN_VALUES[attr];
      if (tokenSet && !tokenSet.has(val)) {
        issues.push(
          makeIssue(
            "aria_04",
            vscode.l10n.t(
              '{0}="{1}" is not a valid value. Allowed: {2}.',
              attr,
              attribs[attr],
              [...tokenSet].join(", "),
            ),
            el as Element,
            $,
            html,
          ),
        );
      }
    }
  });
}

function checkAriaReferences(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  const ARIA_REF_ATTRS = [
    "aria-labelledby",
    "aria-describedby",
    "aria-controls",
    "aria-owns",
  ];
  for (const attr of ARIA_REF_ATTRS) {
    $(`[${attr}]`).each((_, el) => {
      const refs = ($(el).attr(attr) ?? "").trim().split(/\s+/).filter(Boolean);
      for (const ref of refs) {
        if ($(`#${cssEscape(ref)}`).length === 0) {
          issues.push(
            makeIssue(
              "aria_03",
              vscode.l10n.t(
                '{0} references id "{1}" which does not exist in the document.',
                attr,
                ref,
              ),
              el as Element,
              $,
              html,
            ),
          );
        }
      }
    });
  }
}

function checkIds(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  const seen = new Map<string, number>();
  $("[id]").each((_, el) => {
    const id = $(el).attr("id") ?? "";
    if (!id) return;
    seen.set(id, (seen.get(id) ?? 0) + 1);
  });
  const reported = new Set<string>();
  $("[id]").each((_, el) => {
    const id = $(el).attr("id") ?? "";
    if ((seen.get(id) ?? 0) > 1) {
      if (!reported.has(id)) {
        // Skip the first occurrence
        reported.add(id);
        return;
      }
      issues.push(
        makeIssue(
          "id_02",
          vscode.l10n.t('Duplicate id="{0}" found on multiple elements.', id),
          el as Element,
          $,
          html,
        ),
      );
    }
  });
}

function checkMeta(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  // Viewport zoom
  $('meta[name="viewport"]').each((_, el) => {
    const content = $(el).attr("content") ?? "";
    if (
      /user-scalable\s*=\s*no/i.test(content) ||
      /maximum-scale\s*=\s*1(?:\.0+)?(?=[,\s]|$)/i.test(content)
    ) {
      issues.push(
        makeIssue(
          "meta_05",
          vscode.l10n.t(
            '<meta name="viewport" content="{0}"> prevents user zoom.',
            content,
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });

  // Auto-refresh
  $('meta[http-equiv="refresh"]').each((_, el) => {
    const content = ($(el).attr("content") ?? "").trim();
    // Distinguish redirect (url=) from refresh, and delayed from immediate
    const match = content.match(/^(\d+)\s*[;,]?\s*(url\s*=\s*(.+))?$/i);
    const delay = match ? parseInt(match[1], 10) : 0;
    const hasUrl = match ? !!match[2] : false;

    if (hasUrl && delay === 0) {
      // Immediate redirect — meta_02
      issues.push(
        makeIssue(
          "meta_02",
          vscode.l10n.t(
            'Page uses <meta http-equiv="refresh"> for an immediate redirect. Use a server-side redirect.',
          ),
          el as Element,
          $,
          html,
        ),
      );
    } else if (delay > 0) {
      // Delayed refresh or redirect — meta_04
      issues.push(
        makeIssue(
          "meta_04",
          vscode.l10n.t(
            'Page uses <meta http-equiv="refresh"> with a {0} second delay. Users are not in control of the timing.',
            delay,
          ),
          el as Element,
          $,
          html,
        ),
      );
    } else {
      // Generic meta refresh — meta_01
      issues.push(
        makeIssue(
          "meta_01",
          vscode.l10n.t(
            'Page uses <meta http-equiv="refresh"> for automatic reload or redirect.',
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });
}

function checkObsoleteElements(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  const OBSOLETE = [
    "center",
    "font",
    "basefont",
    "marquee",
    "blink",
    "dir",
    "isindex",
    "listing",
    "plaintext",
    "xmp",
    "spacer",
  ];
  OBSOLETE.forEach((tag) => {
    $(tag).each((_, el) => {
      issues.push(
        makeIssue(
          "layout_01a",
          vscode.l10n.t("Obsolete presentational element <{0}> used.", tag),
          el as Element,
          $,
          html,
        ),
      );
    });
  });

  // Non-semantic bold/italic
  $("b, i").each((_, el) => {
    // Only flag if used purely for style (no special context like within <cite>)
    const parent = (el as Element).parent as Element | null;
    if (
      parent?.name &&
      !["cite", "q", "code", "var", "kbd", "samp", "ruby", "rb", "rt"].includes(
        parent.name,
      )
    ) {
      issues.push(
        makeIssue(
          "font_01",
          vscode.l10n.t(
            "<{0}> used for styling; prefer <strong> or <em> for semantic meaning.",
            (el as Element).name,
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });
}

function checkMedia(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  $("video, audio").each((_, el) => {
    const $el = $(el);
    const hasControls = $el.attr("controls") !== undefined;
    const ariaHidden = $el.attr("aria-hidden") === "true";
    if (!hasControls && !ariaHidden) {
      issues.push(
        makeIssue(
          "audio_video_01",
          vscode.l10n.t(
            "<{0}> element is missing the controls attribute.",
            (el as Element).name,
          ),
          el as Element,
          $,
          html,
        ),
      );
    }

    // Autoplay (audio_video_02)
    if ($el.attr("autoplay") !== undefined) {
      const isMuted = $el.attr("muted") !== undefined;
      if (!isMuted) {
        issues.push(
          makeIssue(
            "audio_video_02",
            vscode.l10n.t(
              "<{0}> has autoplay without muted. Automatic audio can disorient users.",
              (el as Element).name,
            ),
            el as Element,
            $,
            html,
          ),
        );
      }
    }
  });
}

function checkEventHandlers(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  // Mouse-only handlers
  $(
    "[onmouseover]:not([onfocus]), [onmouseout]:not([onblur]), [onmouseenter]:not([onfocus])",
  ).each((_, el) => {
    issues.push(
      makeIssue(
        "ehandler_04",
        vscode.l10n.t(
          "Element has mouse event handler but no equivalent keyboard (focus/blur) handler.",
        ),
        el as Element,
        $,
        html,
      ),
    );
  });

  // Double click without keyboard alternative (ehandler_02)
  $("[ondblclick]").each((_, el) => {
    const hasKeyHandler =
      $(el).attr("onkeydown") !== undefined ||
      $(el).attr("onkeyup") !== undefined ||
      $(el).attr("onkeypress") !== undefined;
    if (!hasKeyHandler) {
      issues.push(
        makeIssue(
          "ehandler_02",
          vscode.l10n.t(
            "Element has ondblclick but no keyboard event handler. Keyboard users cannot trigger this action.",
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });

  // tabindex > 0
  $("[tabindex]").each((_, el) => {
    const val = parseInt($(el).attr("tabindex") ?? "0", 10);
    if (val > 0) {
      issues.push(
        makeIssue(
          "element_01",
          vscode.l10n.t(
            'tabindex="{0}" > 0 creates an unpredictable tab order.',
            val,
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });

  // Interactive role on non-interactive element without keyboard support
  $("[role]").each((_, el) => {
    const role = $(el).attr("role") ?? "";
    const tag = (el as Element).name;
    if (INTERACTIVE_ROLES.has(role) && NON_INTERACTIVE_TAGS.has(tag)) {
      const hasTabIndex = $(el).attr("tabindex") !== undefined;
      const hasKeyHandler =
        $(el).attr("onkeydown") !== undefined ||
        $(el).attr("onkeyup") !== undefined ||
        $(el).attr("onkeypress") !== undefined;
      if (!hasTabIndex || !hasKeyHandler) {
        issues.push(
          makeIssue(
            "role_02",
            vscode.l10n.t(
              '<{0} role="{1}"> is missing tabindex="0" and/or keyboard event handler.',
              tag,
              role,
            ),
            el as Element,
            $,
            html,
          ),
        );
      }
    }
  });
}

function checkLists(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  $("li").each((_, el) => {
    const parent = (el as Element).parent as Element | null;
    if (!parent || !["ul", "ol", "menu"].includes(parent.name)) {
      issues.push(
        makeIssue(
          "listitem_02",
          vscode.l10n.t(
            "<li> element is not inside a <ul>, <ol>, or <menu> parent.",
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });

  // Invalid direct children of ul/ol (list_01)
  const VALID_LIST_CHILDREN = new Set(["li", "script", "template"]);
  $("ul, ol").each((_, el) => {
    $(el)
      .children()
      .each((_, child) => {
        if ((child as Element).type !== "tag") return;
        const childName = (child as Element).name;
        if (!VALID_LIST_CHILDREN.has(childName)) {
          issues.push(
            makeIssue(
              "list_01",
              vscode.l10n.t(
                "<{0}> is a direct child of <{1}> but only <li> is allowed.",
                childName,
                (el as Element).name,
              ),
              child as Element,
              $,
              html,
            ),
          );
        }
      });
  });

  // Invalid direct children of dl (list_03)
  const VALID_DL_CHILDREN = new Set(["dt", "dd", "div", "script", "template"]);
  $("dl").each((_, el) => {
    $(el)
      .children()
      .each((_, child) => {
        if ((child as Element).type !== "tag") return;
        const childName = (child as Element).name;
        if (!VALID_DL_CHILDREN.has(childName)) {
          issues.push(
            makeIssue(
              "list_03",
              vscode.l10n.t(
                "<{0}> is a direct child of <dl> but only <dt>, <dd>, or <div> are allowed.",
                childName,
              ),
              child as Element,
              $,
              html,
            ),
          );
        }
      });
  });
}

// ─── Accessibility tree / hidden checks ──────────────────────────────────────

function checkAccessibilityTree(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  // element_02 — aria-hidden="true" containing focusable children
  $('[aria-hidden="true"]').each((_, el) => {
    const $el = $(el);
    const focusableChildren = $el.find(FOCUSABLE_SELECTORS);
    focusableChildren.each((_, child) => {
      const tabindex = $(child).attr("tabindex");
      // Skip children with tabindex=-1 (already removed from tab order)
      if (tabindex !== undefined && parseInt(tabindex, 10) < 0) return;
      issues.push(
        makeIssue(
          "element_02",
          vscode.l10n.t(
            'aria-hidden="true" container has focusable child <{0}>. Keyboard users can still reach it.',
            (child as Element).name,
          ),
          child as Element,
          $,
          html,
        ),
      );
    });
  });

  // element_03 — focusable element itself has aria-hidden="true"
  $(FOCUSABLE_SELECTORS).each((_, el) => {
    const $el = $(el);
    if ($el.attr("aria-hidden") === "true") {
      const tabindex = $el.attr("tabindex");
      if (tabindex !== undefined && parseInt(tabindex, 10) < 0) return;
      issues.push(
        makeIssue(
          "element_03",
          vscode.l10n.t(
            '<{0}> is focusable but has aria-hidden="true". Screen readers will not announce it.',
            (el as Element).name,
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });

  // element_09 — role="presentation"/role="none" on focusable element or with focusable children
  $('[role="presentation"], [role="none"]').each((_, el) => {
    const $el = $(el);
    const tag = (el as Element).name;
    const isFocusable = $el.is(FOCUSABLE_SELECTORS);
    const hasFocusableChildren = $el.find(FOCUSABLE_SELECTORS).length > 0;
    if (isFocusable || hasFocusableChildren) {
      issues.push(
        makeIssue(
          "element_09",
          vscode.l10n.t(
            '<{0} role="{1}"> has focusable content. Presentational role conflicts with interactive semantics.',
            tag,
            $el.attr("role")!,
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });
}

// ─── Structural / misc checks ────────────────────────────────────────────────

function checkStructure(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  // br_01 — Consecutive <br> elements
  $("br").each((_, el) => {
    const next = (el as Element).next;
    // Skip whitespace text nodes
    let sibling: AnyNode | null = next;
    while (
      sibling &&
      sibling.type === "text" &&
      !(sibling as any).data?.trim()
    ) {
      sibling = (sibling as any).next;
    }
    if (sibling && (sibling as Element).name === "br") {
      issues.push(
        makeIssue(
          "br_01",
          vscode.l10n.t(
            "Consecutive <br> elements used for layout spacing. Use CSS margin/padding instead.",
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });

  // blink_02 — text-decoration: blink in inline styles
  $("[style]").each((_, el) => {
    const style = ($(el).attr("style") ?? "").toLowerCase();
    if (/text-decoration\s*:\s*[^;]*blink/.test(style)) {
      issues.push(
        makeIssue(
          "blink_02",
          vscode.l10n.t(
            "Element uses text-decoration: blink. Blinking content can cause seizures.",
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });

  // abbr_01 — <abbr> without title
  $("abbr:not([title]), abbr[title='']").each((_, el) => {
    issues.push(
      makeIssue(
        "abbr_01",
        vscode.l10n.t(
          "<abbr> has no title attribute. Provide the expanded form of the abbreviation.",
        ),
        el as Element,
        $,
        html,
      ),
    );
  });

  // object_02 — <object> without accessible name
  $("object").each((_, el) => {
    const $el = $(el);
    const ariaLabel = ($el.attr("aria-label") ?? "").trim();
    const ariaLabelledBy = ($el.attr("aria-labelledby") ?? "").trim();
    const title = ($el.attr("title") ?? "").trim();
    const ariaHidden = $el.attr("aria-hidden") === "true";
    if (!ariaHidden && !ariaLabel && !ariaLabelledBy && !title) {
      issues.push(
        makeIssue(
          "object_02",
          vscode.l10n.t(
            "<object> has no accessible name (no aria-label, aria-labelledby, or title).",
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });
}

// ─── Focus Visible ───────────────────────────────────────────────────────────

function checkFocusVisible(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  $("[style]").each((_, el) => {
    const style = ($(el).attr("style") ?? "").toLowerCase();
    // Check for outline removal: outline: none, outline: 0, outline:0px, etc.
    if (
      /outline\s*:\s*(none|0(px)?)\b/.test(style) &&
      !/box-shadow|border\s*:|background-color\s*:/.test(style)
    ) {
      issues.push(
        makeIssue(
          "focus_visible_01",
          vscode.l10n.t(
            "Element removes focus outline (outline: none/0) without providing an alternative visible focus indicator.",
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });
}

// ─── Error Identification ────────────────────────────────────────────────────

function checkErrorIdentification(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  $("[aria-invalid='true']").each((_, el) => {
    const $el = $(el);
    const errMsg = ($el.attr("aria-errormessage") ?? "").trim();
    const describedBy = ($el.attr("aria-describedby") ?? "").trim();
    if (!errMsg && !describedBy) {
      issues.push(
        makeIssue(
          "error_id_01",
          vscode.l10n.t(
            'Element has aria-invalid="true" but no aria-errormessage or aria-describedby to describe the error.',
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });
}

// ─── Status Messages ─────────────────────────────────────────────────────────

function checkStatusMessages(
  $: cheerio.CheerioAPI,
  html: string,
  issues: A11yIssue[],
): void {
  $('[role="status"], [role="alert"]').each((_, el) => {
    const $el = $(el);
    const ariaLive = ($el.attr("aria-live") ?? "").trim();
    if (!ariaLive) {
      const role = $el.attr("role")!;
      issues.push(
        makeIssue(
          "status_msg_01",
          vscode.l10n.t(
            'Element with role="{0}" has no explicit aria-live attribute. Add aria-live="{1}" for broader assistive technology support.',
            role,
            role === "alert" ? "assertive" : "polite",
          ),
          el as Element,
          $,
          html,
        ),
      );
    }
  });
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function validateHtml(html: string, filePath: string): ValidationResult {
  const $ = cheerio.load(html, { sourceCodeLocationInfo: true });
  const issues: A11yIssue[] = [];

  checkImages($, html, issues);
  checkLinks($, html, issues);
  checkButtons($, html, issues);
  checkForms($, html, issues);
  checkHeadings($, html, issues);
  checkPage($, html, issues);
  checkLandmarks($, html, issues);
  checkTables($, html, issues);
  checkFrames($, html, issues);
  checkSvg($, html, issues);
  checkAria($, html, issues);
  checkAriaReferences($, html, issues);
  checkIds($, html, issues);
  checkMeta($, html, issues);
  checkObsoleteElements($, html, issues);
  checkMedia($, html, issues);
  checkEventHandlers($, html, issues);
  checkLists($, html, issues);
  checkAccessibilityTree($, html, issues);
  checkStructure($, html, issues);
  checkFocusVisible($, html, issues);
  checkErrorIdentification($, html, issues);
  checkStatusMessages($, html, issues);

  return {
    filePath,
    issues,
    stats: computeStats(issues),
  };
}
