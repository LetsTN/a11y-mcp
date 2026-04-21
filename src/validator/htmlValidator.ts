import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";
import type { A11yIssue, ValidationResult } from "./types";
import { RULES } from "./rules";

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
        "img element is missing the required alt attribute.",
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
          `img alt="${alt}" is a filename or uninformative word. Describe the image meaning.`,
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
          `img alt text is ${alt.length} characters long (max recommended: 100).`,
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
          'Decorative img (alt="") should also have role="presentation" or aria-hidden="true".',
          el as Element,
          $,
          html,
        ),
      );
    }
  });
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
          "Anchor element has no accessible name (no text, aria-label, aria-labelledby, or title).",
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
          `Adjacent links with identical accessible name "${nameA}" pointing to the same URL "${hrefA}". Combine into one link.`,
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
            `Link with accessible name "${name}" points to different URLs elsewhere on the page.`,
            el,
            $,
            html,
          ),
        );
      });
    }
  }
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
          "button element has no accessible name.",
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
          `${el.name} element has no associated label, aria-label, aria-labelledby, or title.`,
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
            `Input "${name}" collects personal data but has no autocomplete attribute. Expected: autocomplete="${expectedToken}".`,
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
          "label has an empty for attribute.",
          el as Element,
          $,
          html,
        ),
      );
    } else if ($(`#${cssEscape(forVal)}`).length === 0) {
      issues.push(
        makeIssue(
          "label_02",
          `label for="${forVal}" does not reference any element with that id.`,
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
          "form has no submit button.",
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
      message: "Page has no <h1> element.",
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
          `Page has ${h1s.length} <h1> elements. Only one is allowed.`,
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
        makeIssue("heading_02", `<${el.name}> element is empty.`, el, $, html),
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
          `Heading level skipped: <h${prevLevel}> followed by <h${level}>.`,
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
      message: "Page is missing a <title> element.",
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
      message: "<title> element is empty.",
      element: $.html($title) ?? "<title></title>",
      selector: "title",
      line: findLineInSource(html, "<title"),
      column: 1,
      fix: RULES.title_03.fix,
      helpUrl: RULES.title_03.helpUrl,
    });
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
      message: "<html> element is missing the lang attribute.",
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
      message: `<html lang="${lang}"> is not a valid BCP 47 language tag.`,
      element: snippet($, $html[0] as Element),
      selector: "html",
      line: 1,
      column: 1,
      fix: RULES.lang_02.fix,
      helpUrl: RULES.lang_02.helpUrl,
    });
  }
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
      message: "Page has no <main> landmark.",
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
            `Page has ${mainCount} <main> / role="main" elements. Only one is allowed.`,
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
        message:
          "The first focusable element on the page is not a skip navigation link.",
        element: snippet($, firstFocusable[0] as Element),
        selector: buildSelector(firstFocusable),
        line: getLocation(firstFocusable[0] as AnyNode).line,
        column: 1,
        fix: RULES.a_02a.fix,
        helpUrl: RULES.a_02a.helpUrl,
      });
    }
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
          "Data table has no <th> header cells.",
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
          "Data table has no <caption> element.",
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
          "Table nested inside another table.",
          nested as Element,
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
        "iframe element has no title attribute.",
        el as Element,
        $,
        html,
      ),
    );
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
          "svg element has no accessible name (no <title>, aria-label, or aria-labelledby).",
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
  const VALID_ROLES = new Set([
    "alert",
    "alertdialog",
    "application",
    "article",
    "banner",
    "blockquote",
    "button",
    "caption",
    "cell",
    "checkbox",
    "code",
    "columnheader",
    "combobox",
    "complementary",
    "contentinfo",
    "definition",
    "deletion",
    "dialog",
    "directory",
    "document",
    "emphasis",
    "feed",
    "figure",
    "form",
    "generic",
    "grid",
    "gridcell",
    "group",
    "heading",
    "img",
    "insertion",
    "link",
    "list",
    "listbox",
    "listitem",
    "log",
    "main",
    "marquee",
    "math",
    "menu",
    "menubar",
    "menuitem",
    "menuitemcheckbox",
    "menuitemradio",
    "meter",
    "navigation",
    "none",
    "note",
    "option",
    "paragraph",
    "presentation",
    "progressbar",
    "radio",
    "radiogroup",
    "region",
    "row",
    "rowgroup",
    "rowheader",
    "scrollbar",
    "search",
    "searchbox",
    "separator",
    "slider",
    "spinbutton",
    "status",
    "strong",
    "subscript",
    "superscript",
    "switch",
    "tab",
    "table",
    "tablist",
    "tabpanel",
    "term",
    "textbox",
    "timer",
    "toolbar",
    "tooltip",
    "tree",
    "treegrid",
    "treeitem",
  ]);

  const REQUIRED_ARIA: Record<string, string[]> = {
    combobox: ["aria-expanded"],
    slider: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
    spinbutton: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
    scrollbar: [
      "aria-valuenow",
      "aria-valuemin",
      "aria-valuemax",
      "aria-controls",
    ],
    separator: [], // only required when focusable
    option: ["aria-selected"],
  };

  // Valid ARIA attributes (prefix check)
  const VALID_ARIA_ATTRS = new Set([
    "aria-activedescendant",
    "aria-atomic",
    "aria-autocomplete",
    "aria-busy",
    "aria-checked",
    "aria-colcount",
    "aria-colindex",
    "aria-colspan",
    "aria-controls",
    "aria-current",
    "aria-describedby",
    "aria-description",
    "aria-details",
    "aria-disabled",
    "aria-dropeffect",
    "aria-errormessage",
    "aria-expanded",
    "aria-flowto",
    "aria-grabbed",
    "aria-haspopup",
    "aria-hidden",
    "aria-invalid",
    "aria-keyshortcuts",
    "aria-label",
    "aria-labelledby",
    "aria-level",
    "aria-live",
    "aria-modal",
    "aria-multiline",
    "aria-multiselectable",
    "aria-orientation",
    "aria-owns",
    "aria-placeholder",
    "aria-posinset",
    "aria-pressed",
    "aria-readonly",
    "aria-relevant",
    "aria-required",
    "aria-roledescription",
    "aria-rowcount",
    "aria-rowindex",
    "aria-rowspan",
    "aria-selected",
    "aria-setsize",
    "aria-sort",
    "aria-valuemax",
    "aria-valuemin",
    "aria-valuenow",
    "aria-valuetext",
  ]);

  $("[role]").each((_, el) => {
    const roles = ($(el).attr("role") ?? "").trim().split(/\s+/);
    for (const role of roles) {
      if (!VALID_ROLES.has(role)) {
        issues.push(
          makeIssue(
            "aria_01",
            `role="${role}" is not a valid WAI-ARIA role.`,
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
                `role="${role}" requires the "${req}" attribute.`,
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

  // Unknown aria-* attributes
  $("*").each((_, el) => {
    const attribs = (el as Element).attribs ?? {};
    for (const attr of Object.keys(attribs)) {
      if (attr.startsWith("aria-") && !VALID_ARIA_ATTRS.has(attr)) {
        issues.push(
          makeIssue(
            "aria_07",
            `Unknown ARIA attribute: ${attr}.`,
            el as Element,
            $,
            html,
          ),
        );
      }
    }
  });
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
  $("[id]").each((_, el) => {
    const id = $(el).attr("id") ?? "";
    if ((seen.get(id) ?? 0) > 1) {
      issues.push(
        makeIssue(
          "id_02",
          `Duplicate id="${id}" found on multiple elements.`,
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
          `<meta name="viewport" content="${content}"> prevents user zoom.`,
          el as Element,
          $,
          html,
        ),
      );
    }
  });

  // Auto-refresh
  $('meta[http-equiv="refresh"]').each((_, el) => {
    issues.push(
      makeIssue(
        "meta_01",
        'Page uses <meta http-equiv="refresh"> for automatic reload or redirect.',
        el as Element,
        $,
        html,
      ),
    );
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
          `Obsolete presentational element <${tag}> used.`,
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
          `<${(el as Element).name}> used for styling; prefer <strong> or <em> for semantic meaning.`,
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
          `<${(el as Element).name}> element is missing the controls attribute.`,
          el as Element,
          $,
          html,
        ),
      );
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
        `Element has mouse event handler but no equivalent keyboard (focus/blur) handler.`,
        el as Element,
        $,
        html,
      ),
    );
  });

  // tabindex > 0
  $("[tabindex]").each((_, el) => {
    const val = parseInt($(el).attr("tabindex") ?? "0", 10);
    if (val > 0) {
      issues.push(
        makeIssue(
          "element_01",
          `tabindex="${val}" > 0 creates an unpredictable tab order.`,
          el as Element,
          $,
          html,
        ),
      );
    }
  });

  // Interactive role on non-interactive element without keyboard support
  const INTERACTIVE_ROLES = new Set([
    "button",
    "link",
    "menuitem",
    "option",
    "treeitem",
    "tab",
    "menuitemcheckbox",
    "menuitemradio",
    "checkbox",
    "radio",
    "switch",
  ]);
  const NON_INTERACTIVE_TAGS = new Set([
    "div",
    "span",
    "p",
    "section",
    "article",
    "header",
    "footer",
    "main",
    "aside",
    "nav",
    "li",
    "ul",
    "ol",
  ]);
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
            `<${tag} role="${role}"> is missing tabindex="0" and/or keyboard event handler.`,
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
          "<li> element is not inside a <ul>, <ol>, or <menu> parent.",
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
  checkIds($, html, issues);
  checkMeta($, html, issues);
  checkObsoleteElements($, html, issues);
  checkMedia($, html, issues);
  checkEventHandlers($, html, issues);
  checkLists($, html, issues);

  return {
    filePath,
    issues,
    stats: {
      errors: issues.filter((i) => i.severity === "error").length,
      warnings: issues.filter((i) => i.severity === "warning").length,
      notices: issues.filter((i) => i.severity === "notice").length,
      total: issues.length,
    },
  };
}
