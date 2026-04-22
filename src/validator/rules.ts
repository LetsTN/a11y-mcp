import type { A11yRule } from "./types";

/** Full catalog of implemented accessibility rules.
 *  Keys match the AccessMonitor rule IDs where applicable.
 */
export const RULES: Readonly<Record<string, A11yRule>> = {
  // ─── Images ────────────────────────────────────────────────────────────────
  img_01b: {
    id: "img_01b",
    title: "Missing Image Alt Text",
    description:
      "Every <img> element must have an alt attribute. Without it, screen readers announce the file name or nothing, making images inaccessible to blind users.",
    wcagCriteria: ["1.1.1"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/img_01b.html",
    fix: 'Add alt="<descriptive text>" to the <img>. For purely decorative images use alt="".',
  },
  img_03: {
    id: "img_03",
    title: "Inappropriate Alt Text",
    description:
      'The alt attribute value is a filename, URL, or uninformative word (e.g. "image", "photo", "icon"). Alt text must describe the meaning or function of the image.',
    wcagCriteria: ["1.1.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl: "https://amagovpt.github.io/accessmonitor-rulesets/en/img_03.html",
    fix: "Replace the alt value with a concise description of what the image depicts or its purpose.",
  },
  img_04: {
    id: "img_04",
    title: "Alt Text Too Long",
    description:
      "The alt attribute value exceeds 100 characters. Long alt text is hard to follow when read aloud. Consider using a <figure> with <figcaption> for complex descriptions.",
    wcagCriteria: ["1.1.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl: "https://amagovpt.github.io/accessmonitor-rulesets/en/img_04.html",
    fix: "Shorten the alt text to ≤100 characters. Move longer descriptions to a <figcaption> or the surrounding paragraph.",
  },
  img_02: {
    id: "img_02",
    title: "Decorative Image Not Hidden",
    description:
      'An image with alt="" (decorative) should also have role="presentation" or be hidden from assistive technologies to avoid unnecessary announcements.',
    wcagCriteria: ["1.1.1"],
    wcagLevel: "A",
    severity: "notice",
    helpUrl: "https://amagovpt.github.io/accessmonitor-rulesets/en/img_02.html",
    fix: 'Add role="presentation" or aria-hidden="true" to explicitly mark the image as decorative.',
  },

  // ─── Links ─────────────────────────────────────────────────────────────────
  a_11: {
    id: "a_11",
    title: "Missing Link Accessible Name",
    description:
      "A link has no accessible name (no visible text, no aria-label, no aria-labelledby, and no title). Screen readers will have no way to describe the link.",
    wcagCriteria: ["2.4.4", "4.1.2"],
    wcagLevel: "A",
    severity: "error",
    helpUrl: "https://amagovpt.github.io/accessmonitor-rulesets/en/a_11.html",
    fix: 'Add descriptive text inside the <a> element, or use aria-label="<description>" if the link contains only an icon or image.',
  },
  a_06: {
    id: "a_06",
    title: "Adjacent Identical Links",
    description:
      "Two adjacent links point to the same destination and have the same accessible name. This creates a confusing, redundant experience for keyboard and screen reader users.",
    wcagCriteria: ["2.4.4"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl: "https://amagovpt.github.io/accessmonitor-rulesets/en/a_06.html",
    fix: "Combine the two links into one, or wrap image + text in a single <a>.",
  },
  a_09: {
    id: "a_09",
    title: "Identical Links With Different Destinations",
    description:
      "Multiple links share the same accessible name but point to different URLs. Users relying on link lists cannot distinguish them.",
    wcagCriteria: ["2.4.4", "2.4.9"],
    wcagLevel: "AA",
    severity: "warning",
    helpUrl: "https://amagovpt.github.io/accessmonitor-rulesets/en/a_09.html",
    fix: "Give each link a unique, descriptive accessible name that reflects its destination.",
  },

  // ─── Buttons ───────────────────────────────────────────────────────────────
  button_02: {
    id: "button_02",
    title: "Missing Button Accessible Name",
    description:
      "A <button> has no text content, no aria-label, no aria-labelledby, and no value or title attribute. Screen readers cannot announce its purpose.",
    wcagCriteria: ["4.1.2"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/button_02.html",
    fix: 'Add visible text inside the <button>, or aria-label="<action>" for icon-only buttons.',
  },

  // ─── Forms ─────────────────────────────────────────────────────────────────
  input_01: {
    id: "input_01",
    title: "Missing Form Control Label",
    description:
      "An <input>, <select>, or <textarea> has no associated <label> (via for/id), no aria-label, no aria-labelledby, and no title. Users cannot determine the purpose of the field.",
    wcagCriteria: ["1.3.1", "3.3.2"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/input_01.html",
    fix: 'Associate a <label for="inputId"> with the control, or add aria-label="<description>" directly on the element.',
  },
  form_01b: {
    id: "form_01b",
    title: "Missing Form Submit Button",
    description:
      'A <form> element does not contain a visible submit button (<button type="submit">, <input type="submit">, or <input type="image">). Users should always be able to submit a form explicitly.',
    wcagCriteria: ["3.2.2"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/form_01b.html",
    fix: 'Add <button type="submit">Submit</button> to the form.',
  },
  label_02: {
    id: "label_02",
    title: "Label Without Associated Control",
    description:
      "A <label> element has a for attribute that does not match any control's id, or has an empty for attribute. The label is not programmatically linked to any input.",
    wcagCriteria: ["1.3.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/label_02.html",
    fix: "Ensure the for attribute matches the id of the target form control.",
  },
  autocomplete_01: {
    id: "autocomplete_01",
    title: "Missing Autocomplete on Personal Data Input",
    description:
      "An input that collects personal information (name, email, phone, address, etc.) is missing an appropriate autocomplete attribute. This prevents browsers and assistive technologies from offering autofill.",
    wcagCriteria: ["1.3.5"],
    wcagLevel: "AA",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/autocomplete_01.html",
    fix: 'Add autocomplete="<token>" using the appropriate WCAG 1.3.5 token (e.g. name, email, tel, street-address).',
  },

  // ─── Headings ──────────────────────────────────────────────────────────────
  heading_02: {
    id: "heading_02",
    title: "Empty Heading",
    description:
      "A heading element (h1–h6) has no text content. Empty headings pollute the document outline and confuse navigation by screen reader users.",
    wcagCriteria: ["2.4.6"],
    wcagLevel: "AA",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/heading_02.html",
    fix: "Either remove the empty heading or add meaningful text content to it.",
  },
  hx_01a: {
    id: "hx_01a",
    title: "No Headings on Page",
    description:
      "The page contains substantial text content but no heading elements. Headings are the primary navigation mechanism for screen reader users.",
    wcagCriteria: ["2.4.1", "2.4.6"],
    wcagLevel: "AA",
    severity: "warning",
    helpUrl: "https://amagovpt.github.io/accessmonitor-rulesets/en/hx_01a.html",
    fix: "Structure your content with appropriate h1–h6 heading elements to create a navigable document outline.",
  },
  hx_01c: {
    id: "hx_01c",
    title: "Missing Main Heading (H1)",
    description:
      "The page has no <h1> element. Every page should have exactly one <h1> that describes its main topic, giving screen reader users a clear entry point.",
    wcagCriteria: ["2.4.6"],
    wcagLevel: "AA",
    severity: "warning",
    helpUrl: "https://amagovpt.github.io/accessmonitor-rulesets/en/hx_01c.html",
    fix: "Add one <h1> element that clearly describes the main purpose of the page.",
  },
  hx_03: {
    id: "hx_03",
    title: "Skipped Heading Level",
    description:
      "The heading hierarchy jumps a level (e.g. h1 → h3 without an h2). This breaks the logical document structure relied upon by assistive technologies.",
    wcagCriteria: ["1.3.1", "2.4.6"],
    wcagLevel: "AA",
    severity: "warning",
    helpUrl: "https://amagovpt.github.io/accessmonitor-rulesets/en/hx_03.html",
    fix: "Use heading levels in sequence. Adjust levels so no level is skipped.",
  },
  heading_04: {
    id: "heading_04",
    title: "Multiple H1 Elements",
    description:
      "The page contains more than one <h1> element. Each page should have exactly one <h1> to clearly indicate the primary topic.",
    wcagCriteria: ["2.4.6"],
    wcagLevel: "AA",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/heading_04.html",
    fix: "Keep one <h1> for the main page title and demote additional h1 elements to h2 or lower.",
  },

  // ─── Page-level ────────────────────────────────────────────────────────────
  title_02: {
    id: "title_02",
    title: "Missing Page Title",
    description:
      "The document has no <title> element. The page title is the first thing screen readers announce and is essential for browser tab identification and navigation.",
    wcagCriteria: ["2.4.2"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/title_02.html",
    fix: "Add a <title> element inside <head> with a descriptive title for the page.",
  },
  title_03: {
    id: "title_03",
    title: "Empty Page Title",
    description:
      "The <title> element exists but contains no text. An empty title is equivalent to having no title for assistive technology users.",
    wcagCriteria: ["2.4.2"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/title_03.html",
    fix: "Add a descriptive text content inside the <title> element.",
  },
  lang_03: {
    id: "lang_03",
    title: "Missing Page Language",
    description:
      "The <html> element is missing the lang attribute. Without it, screen readers cannot automatically select the correct pronunciation and language rules.",
    wcagCriteria: ["3.1.1"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/lang_03.html",
    fix: 'Add lang="<BCP47 tag>" to the <html> element, e.g. lang="pt" or lang="en".',
  },
  lang_02: {
    id: "lang_02",
    title: "Invalid Page Language",
    description:
      "The lang attribute on <html> contains a value that is not a valid BCP 47 language tag. Screen readers may use incorrect pronunciation rules.",
    wcagCriteria: ["3.1.1"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/lang_02.html",
    fix: 'Set lang to a valid BCP 47 tag, e.g. "en", "pt", "pt-BR", "fr".',
  },

  // ─── Landmarks ─────────────────────────────────────────────────────────────
  landmark_07: {
    id: "landmark_07",
    title: "Missing Main Landmark",
    description:
      'The page has no <main> element or element with role="main". Screen reader users rely on the main landmark to skip directly to the primary content.',
    wcagCriteria: ["2.4.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/landmark_07.html",
    fix: "Wrap the primary page content in a <main> element.",
  },
  landmark_14: {
    id: "landmark_14",
    title: "Duplicate Main Landmark",
    description:
      'The page contains more than one <main> element or role="main". There must be only one main landmark per page.',
    wcagCriteria: ["2.4.1"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/landmark_14.html",
    fix: 'Keep exactly one <main> element, or use hidden="true" / aria-hidden="true" on inactive ones.',
  },
  a_02a: {
    id: "a_02a",
    title: "Missing Skip Navigation Link",
    description:
      "The page has no skip navigation link as its first focusable element. Keyboard users cannot bypass repetitive navigation blocks.",
    wcagCriteria: ["2.4.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl: "https://amagovpt.github.io/accessmonitor-rulesets/en/a_02a.html",
    fix: 'Add a "Skip to main content" link as the first focusable element, e.g. <a href="#main" class="skip-link">Skip to main content</a>.',
  },

  // ─── Tables ────────────────────────────────────────────────────────────────
  table_05a: {
    id: "table_05a",
    title: "Data Table Missing Header Cells",
    description:
      "A <table> that appears to contain data has no <th> header cells. Screen reader users cannot understand the relationship between data cells and their column/row headers.",
    wcagCriteria: ["1.3.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/table_05a.html",
    fix: 'Add <th scope="col"> for column headers and <th scope="row"> for row headers.',
  },
  table_02: {
    id: "table_02",
    title: "Data Table Missing Caption",
    description:
      "A data <table> has no <caption> element. A caption provides a visible and programmatic title for the table, helping all users understand its purpose.",
    wcagCriteria: ["1.3.1"],
    wcagLevel: "A",
    severity: "notice",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/table_02.html",
    fix: "Add a <caption> as the first child of <table> with a brief description of the table's content.",
  },
  table_04: {
    id: "table_04",
    title: "Nested Tables",
    description:
      "Tables nested inside other tables (layout or data) create complex structures that screen readers handle poorly.",
    wcagCriteria: ["1.3.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/table_04.html",
    fix: "Avoid nested tables. Use CSS for layout and separate independent tables for data.",
  },

  // ─── Frames & Iframes ──────────────────────────────────────────────────────
  iframe_01: {
    id: "iframe_01",
    title: "Iframe Missing Title",
    description:
      "An <iframe> has no title attribute. Screen readers announce the title to help users understand the purpose of embedded content before deciding whether to enter it.",
    wcagCriteria: ["4.1.2"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/iframe_01.html",
    fix: 'Add a descriptive title attribute to the <iframe>, e.g. title="YouTube video: Product demo".',
  },

  // ─── SVG ───────────────────────────────────────────────────────────────────
  svg_02: {
    id: "svg_02",
    title: "SVG Missing Accessible Name",
    description:
      "A meaningful <svg> element has no accessible name. Without a <title> child element or aria-label, screen readers cannot convey the image's meaning.",
    wcagCriteria: ["1.1.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl: "https://amagovpt.github.io/accessmonitor-rulesets/en/svg_02.html",
    fix: 'Add a <title> as the first child of <svg> and set role="img" aria-labelledby="<titleId>" on the <svg> element. For decorative SVGs use aria-hidden="true".',
  },

  // ─── ARIA ──────────────────────────────────────────────────────────────────
  aria_01: {
    id: "aria_01",
    title: "Invalid ARIA Role",
    description:
      "An element has a role attribute with a value that is not a recognised WAI-ARIA role. Invalid roles are ignored by assistive technologies.",
    wcagCriteria: ["4.1.2"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/aria_01.html",
    fix: "Replace the role value with a valid WAI-ARIA role (see https://www.w3.org/TR/wai-aria/#role_definitions).",
  },
  aria_02: {
    id: "aria_02",
    title: "Missing Required ARIA Attribute",
    description:
      'An element with an ARIA role is missing a required state or property. For example, role="combobox" requires aria-expanded, and role="slider" requires aria-valuenow.',
    wcagCriteria: ["4.1.2"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/aria_02.html",
    fix: "Add the required ARIA state/property attributes for the role. Refer to https://www.w3.org/TR/wai-aria/#requiredState.",
  },
  aria_07: {
    id: "aria_07",
    title: "Unknown ARIA Attribute",
    description:
      "An element has an aria-* attribute that is not a recognised WAI-ARIA state or property. Unknown attributes are ignored by browsers and assistive technologies.",
    wcagCriteria: ["4.1.2"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/aria_07.html",
    fix: "Remove or correct the misspelled aria-* attribute.",
  },

  // ─── IDs ───────────────────────────────────────────────────────────────────
  id_02: {
    id: "id_02",
    title: "Duplicate ID Attribute",
    description:
      "Multiple elements share the same id value. IDs must be unique within a document; duplicate IDs break aria-labelledby, aria-describedby, htmlFor, and fragment links.",
    wcagCriteria: ["4.1.2"],
    wcagLevel: "A",
    severity: "error",
    helpUrl: "https://amagovpt.github.io/accessmonitor-rulesets/en/id_02.html",
    fix: "Ensure every id value is unique within the page.",
  },

  // ─── Meta / Viewport ───────────────────────────────────────────────────────
  meta_05: {
    id: "meta_05",
    title: "Viewport Zoom Disabled",
    description:
      'The <meta name="viewport"> tag includes user-scalable=no or maximum-scale=1.0, preventing users from zooming. This is especially harmful for users with low vision.',
    wcagCriteria: ["1.4.4"],
    wcagLevel: "AA",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/meta_05.html",
    fix: "Remove user-scalable=no and any maximum-scale value below 5.0 from the viewport meta tag.",
  },
  meta_01: {
    id: "meta_01",
    title: "Automatic Page Refresh",
    description:
      'The page uses <meta http-equiv="refresh"> to automatically reload or redirect. This can disorient users and interrupt screen reader announcements.',
    wcagCriteria: ["2.2.1", "2.2.4"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/meta_01.html",
    fix: "Remove the meta refresh tag. Use server-side redirects or notify the user before any timed action.",
  },

  // ─── Obsolete / Presentational Elements ───────────────────────────────────
  layout_01a: {
    id: "layout_01a",
    title: "Obsolete Presentational Element",
    description:
      "The page uses a presentational HTML element that has been deprecated in HTML5 (<center>, <font>, <basefont>, <marquee>, <blink>). These convey presentation rather than meaning.",
    wcagCriteria: ["1.3.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/layout_01a.html",
    fix: "Replace deprecated elements with CSS. Use text-align:center instead of <center>, CSS font properties instead of <font>, etc.",
  },
  font_01: {
    id: "font_01",
    title: "Non-Semantic Bold/Italic Markup",
    description:
      "The page uses <b> or <i> for styling without semantic meaning. These should be replaced with <strong> or <em> to convey emphasis semantically.",
    wcagCriteria: ["1.3.1"],
    wcagLevel: "A",
    severity: "notice",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/font_01.html",
    fix: "Use <strong> for strong importance and <em> for stress emphasis. Reserve <b> and <i> only for stylistic use without semantic meaning.",
  },

  // ─── Media ─────────────────────────────────────────────────────────────────
  audio_video_01: {
    id: "audio_video_01",
    title: "Video/Audio Without Controls",
    description:
      "A <video> or <audio> element does not have the controls attribute, removing the ability for users to play, pause, or adjust volume using keyboard or AT.",
    wcagCriteria: ["1.2.1", "2.1.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/audio_video_01.html",
    fix: "Add the controls attribute to <video> and <audio> elements, or provide a fully accessible custom control interface.",
  },

  // ─── Event Handlers ────────────────────────────────────────────────────────
  ehandler_04: {
    id: "ehandler_04",
    title: "Mouse-Only Event Handler",
    description:
      "An element uses onmouseover, onmouseout, or onmouseenter without equivalent keyboard events (onfocus/onblur). Keyboard and switch device users cannot trigger this interaction.",
    wcagCriteria: ["2.1.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/ehandler_04.html",
    fix: "Add matching onfocus/onblur handlers, or use :focus/:focus-within CSS, to expose the same functionality to keyboard users.",
  },

  // ─── Tabindex ──────────────────────────────────────────────────────────────
  element_01: {
    id: "element_01",
    title: "Positive Tabindex Value",
    description:
      "An element has a tabindex value greater than 0. Positive tabindex values create a custom tab order that is confusing and fragile, often breaking the natural DOM order.",
    wcagCriteria: ["2.4.3"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/element_01.html",
    fix: 'Set tabindex="0" to include the element in the natural tab order, or reorganise the DOM order instead.',
  },

  // ─── Lists ─────────────────────────────────────────────────────────────────
  listitem_02: {
    id: "listitem_02",
    title: "List Item Outside List",
    description:
      "A <li> element appears outside a <ul> or <ol> parent. This is invalid HTML that breaks the semantic meaning of list items for screen reader users.",
    wcagCriteria: ["1.3.1"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/listitem_02.html",
    fix: "Wrap the <li> elements in a <ul> or <ol> parent element.",
  },

  // ─── Color Contrast (static hint) ─────────────────────────────────────────
  color_02: {
    id: "color_02",
    title: "Potentially Insufficient Text Contrast (Inline)",
    description:
      "An inline style sets a text color and/or background color that may produce a contrast ratio below the required 4.5:1 (normal text) or 3:1 (large text) threshold. Automated static analysis provides a hint; verify with a contrast checker.",
    wcagCriteria: ["1.4.3"],
    wcagLevel: "AA",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/color_02.html",
    fix: "Verify the color contrast ratio using a tool like the WebAIM Contrast Checker. Adjust colors to meet at least 4.5:1 for normal text and 3:1 for large text.",
  },

  // ─── Role on non-interactive element ───────────────────────────────────────
  role_02: {
    id: "role_02",
    title: "Interactive Role on Non-Interactive Element",
    description:
      "A non-interactive element (div, span, p, etc.) has an interactive ARIA role (button, link, menuitem, etc.) but no keyboard interaction support. The element is operable by mouse but not by keyboard.",
    wcagCriteria: ["2.1.1", "4.1.2"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/role_02.html",
    fix: 'Replace the element with the appropriate semantic HTML element (<button>, <a>, etc.), or add tabindex="0" and keyboard event handlers.',
  },

  // ─── Tables (additional) ─────────────────────────────────────────────────
  table_06: {
    id: "table_06",
    title: "Table Header Missing Scope",
    description:
      "A <th> element in a data table does not have a scope attribute. Without scope, assistive technologies may incorrectly associate data cells with headers in complex tables.",
    wcagCriteria: ["1.3.1"],
    wcagLevel: "A",
    severity: "notice",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/table_06.html",
    fix: 'Add scope="col" for column headers or scope="row" for row headers to each <th> element.',
  },

  // ─── ARIA (additional) ─────────────────────────────────────────────────────
  aria_03: {
    id: "aria_03",
    title: "ARIA Reference to Non-Existent ID",
    description:
      "An aria-labelledby, aria-describedby, aria-controls, or aria-owns attribute references an ID that does not exist in the document. The relationship is broken and assistive technologies will ignore it.",
    wcagCriteria: ["4.1.2"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/aria_03.html",
    fix: "Ensure the referenced ID exists in the document, or remove the broken reference.",
  },

  // ─── Links (additional) ────────────────────────────────────────────────────
  a_10: {
    id: "a_10",
    title: "Link Opens New Window Without Warning",
    description:
      'A link with target="_blank" opens in a new window or tab without informing the user. This can be disorienting, especially for screen reader and cognitive disability users.',
    wcagCriteria: ["3.2.5"],
    wcagLevel: "AAA",
    severity: "notice",
    helpUrl: "https://amagovpt.github.io/accessmonitor-rulesets/en/a_10.html",
    fix: 'Add visible text or an aria-label indicating the link opens in a new window, e.g. "(opens in new tab)". Also add rel="noopener" for security.',
  },

  // ─── JSX-specific ──────────────────────────────────────────────────────────
  jsx_onclick_div: {
    id: "jsx_onclick_div",
    title: "onClick on Non-Interactive Element (JSX)",
    description:
      "A non-interactive element (<div>, <span>, <p>, etc.) has an onClick handler but no role attribute and no tabIndex. Keyboard and assistive technology users cannot interact with it.",
    wcagCriteria: ["2.1.1", "4.1.2"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl: "https://wcag.com/blog/wcag-criterion-2-1-1-keyboard/",
    fix: 'Use a <button> or <a> element instead, or add role="button" tabIndex={0} and onKeyDown handler.',
  },

  // ─── Links (additional) ────────────────────────────────────────────────────
  a_03: {
    id: "a_03",
    title: "Image Link Missing Alt Text",
    description:
      "A link contains only an image that has an empty or missing alt attribute. The link has no accessible name.",
    wcagCriteria: ["2.4.4", "2.4.9", "4.1.2"],
    wcagLevel: "A",
    severity: "error",
    helpUrl: "https://amagovpt.github.io/accessmonitor-rulesets/en/a_03.html",
    fix: "Add descriptive alt text to the image inside the link, describing the link destination or function.",
  },
  a_05: {
    id: "a_05",
    title: "Redundant Link Title",
    description:
      "The title attribute on a link duplicates the link's visible text. This creates redundant announcements for screen reader users.",
    wcagCriteria: ["2.4.4"],
    wcagLevel: "A",
    severity: "notice",
    helpUrl: "https://amagovpt.github.io/accessmonitor-rulesets/en/a_05.html",
    fix: "Remove the title attribute if it repeats the link text, or use it to provide additional context.",
  },
  a_02b: {
    id: "a_02b",
    title: "Multiple Skip Navigation Links",
    description:
      "The page contains multiple skip navigation links. While not always harmful, it can be confusing for keyboard users.",
    wcagCriteria: ["2.4.1"],
    wcagLevel: "A",
    severity: "notice",
    helpUrl: "https://amagovpt.github.io/accessmonitor-rulesets/en/a_02b.html",
    fix: "Review whether all skip navigation links are necessary. Typically one skip link to #main is sufficient.",
  },

  // ─── Abbreviations ────────────────────────────────────────────────────────
  abbr_01: {
    id: "abbr_01",
    title: "Abbreviation Without Expansion",
    description:
      "An <abbr> element has no title attribute to provide the expanded form of the abbreviation. Users unfamiliar with the abbreviation cannot understand it.",
    wcagCriteria: ["3.1.4"],
    wcagLevel: "AAA",
    severity: "notice",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/abbr_01.html",
    fix: 'Add a title attribute with the expanded form: <abbr title="HyperText Markup Language">HTML</abbr>.',
  },

  // ─── Area ──────────────────────────────────────────────────────────────────
  area_01b: {
    id: "area_01b",
    title: "Image Map Area Missing Alt Text",
    description:
      "An <area> element in an image map has no alt attribute. Screen readers cannot describe the clickable region.",
    wcagCriteria: ["1.1.1", "2.4.4"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/area_01b.html",
    fix: 'Add alt="<description>" to the <area> element describing its function or destination.',
  },

  // ─── ARIA (additional) ─────────────────────────────────────────────────────
  aria_04: {
    id: "aria_04",
    title: "Invalid ARIA State/Property Value",
    description:
      'An ARIA state or property has a value that is not allowed for its type. For example, aria-hidden="yes" is invalid (expected "true" or "false").',
    wcagCriteria: ["4.1.2"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/aria_04.html",
    fix: "Use a valid value for the ARIA attribute. Boolean attributes accept 'true' or 'false'. Token attributes accept specific predefined values.",
  },

  // ─── Audio/Video (additional) ──────────────────────────────────────────────
  audio_video_02: {
    id: "audio_video_02",
    title: "Automatic Audio Content",
    description:
      "A <video> or <audio> element has the autoplay attribute. Automatic audio playback can be disorienting and harmful to screen reader users.",
    wcagCriteria: ["1.4.2"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/audio_video_02.html",
    fix: "Remove the autoplay attribute or ensure the media is muted by default and the user can control playback.",
  },

  // ─── Blink ─────────────────────────────────────────────────────────────────
  blink_02: {
    id: "blink_02",
    title: "Blinking Content",
    description:
      "The page uses CSS text-decoration: blink or equivalent. Blinking content can cause seizures and is distracting for users with cognitive disabilities.",
    wcagCriteria: ["2.2.2"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/blink_02.html",
    fix: "Remove text-decoration: blink from all CSS rules. Use subtle transitions if animation is needed, with a mechanism to pause.",
  },

  // ─── BR ────────────────────────────────────────────────────────────────────
  br_01: {
    id: "br_01",
    title: "Consecutive Line Breaks Used for Layout",
    description:
      "Multiple consecutive <br> elements are used to create visual spacing. This is a misuse of HTML for layout purposes and may confuse screen readers.",
    wcagCriteria: ["1.3.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl: "https://amagovpt.github.io/accessmonitor-rulesets/en/br_01.html",
    fix: "Use CSS margin or padding for spacing instead of multiple <br> elements.",
  },

  // ─── Event handlers (additional) ──────────────────────────────────────────
  ehandler_02: {
    id: "ehandler_02",
    title: "Missing Redundant Keyboard Event Handler",
    description:
      "An element uses ondblclick without a keyboard-accessible alternative. Double-click actions are inaccessible to keyboard and assistive technology users.",
    wcagCriteria: ["2.1.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/ehandler_02.html",
    fix: "Provide a keyboard alternative for the double-click action (e.g. onkeydown with Enter/Space).",
  },

  // ─── Elements (additional) ────────────────────────────────────────────────
  element_02: {
    id: "element_02",
    title: "ARIA Hidden Focusable Content",
    description:
      'An element with aria-hidden="true" contains focusable content (links, buttons, inputs, etc.). Screen readers hide the element but keyboard users can still tab to it.',
    wcagCriteria: ["4.1.2"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/element_02.html",
    fix: 'Remove aria-hidden="true" from the container, or add tabindex="-1" to all focusable children, or remove the focusable elements from the hidden container.',
  },
  element_03: {
    id: "element_03",
    title: "Focusable Element Hidden from Assistive Technology",
    description:
      'A focusable element (e.g. <a>, <button>, <input>) itself has aria-hidden="true". Keyboard users can still reach it but screen readers won\'t announce it.',
    wcagCriteria: ["4.1.2"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/element_03.html",
    fix: 'Remove aria-hidden="true" from the focusable element, or add tabindex="-1" to take it out of the tab order.',
  },
  element_07: {
    id: "element_07",
    title: "Invalid Language Attribute on Element",
    description:
      "An element has a lang attribute with a value that is not a valid BCP 47 language tag.",
    wcagCriteria: ["3.1.2"],
    wcagLevel: "AA",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/element_07.html",
    fix: 'Set the lang attribute to a valid BCP 47 tag, e.g. "en", "pt-BR", "es".',
  },
  element_09: {
    id: "element_09",
    title: "Presentational Role Conflicts with Semantics",
    description:
      'An element with role="presentation" or role="none" has focusable children or is itself focusable. The presentational role removes semantic meaning but focus remains.',
    wcagCriteria: ["1.3.1", "4.1.2"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/element_09.html",
    fix: 'Remove role="presentation" / role="none", or ensure the element and its children are not focusable.',
  },

  // ─── Fieldset / Legend ────────────────────────────────────────────────────
  field_01: {
    id: "field_01",
    title: "Fieldset Without Legend",
    description:
      "A <fieldset> element has no <legend> child. The legend provides a group label for the set of form controls.",
    wcagCriteria: ["1.3.1", "3.3.2"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/field_01.html",
    fix: "Add a <legend> as the first child of the <fieldset> with a descriptive group label.",
  },

  // ─── Frame ────────────────────────────────────────────────────────────────
  frame_01: {
    id: "frame_01",
    title: "Frame Missing Title",
    description:
      "A <frame> element has no title attribute. Screen readers need the title to describe the purpose of the frame to users.",
    wcagCriteria: ["4.1.2"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/frame_01.html",
    fix: "Add a descriptive title attribute to the <frame> element.",
  },

  // ─── Headers ──────────────────────────────────────────────────────────────
  headers_02: {
    id: "headers_02",
    title: "Table Cell Headers Reference Non-Existent ID",
    description:
      "A <td> or <th> element has a headers attribute that references an id that does not exist in the table. The header/cell association is broken.",
    wcagCriteria: ["1.3.1"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/headers_02.html",
    fix: "Ensure every ID in the headers attribute matches an existing <th> element's id within the same table.",
  },

  // ─── Headings (additional) ────────────────────────────────────────────────
  hx_02: {
    id: "hx_02",
    title: "Heading Contains Only Non-Text Content",
    description:
      "A heading element contains only an image without alt text, or other non-text content with no accessible name. The heading has no accessible name.",
    wcagCriteria: ["1.3.1", "2.4.6"],
    wcagLevel: "AA",
    severity: "warning",
    helpUrl: "https://amagovpt.github.io/accessmonitor-rulesets/en/hx_02.html",
    fix: "Add descriptive text to the heading, or ensure images inside it have meaningful alt text.",
  },

  // ─── Iframe (additional) ──────────────────────────────────────────────────
  iframe_02: {
    id: "iframe_02",
    title: "Iframes With Identical Accessible Names",
    description:
      "Multiple <iframe> elements on the page share the same title attribute value. Users cannot distinguish between them.",
    wcagCriteria: ["4.1.2"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/iframe_02.html",
    fix: "Give each <iframe> a unique and descriptive title attribute.",
  },
  iframe_04: {
    id: "iframe_04",
    title: "Iframe With Negative Tabindex",
    description:
      'An <iframe> has tabindex="-1", which prevents keyboard users from reaching the iframe content via Tab.',
    wcagCriteria: ["2.1.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/iframe_04.html",
    fix: "Remove the negative tabindex from the <iframe>, or ensure the iframe content is accessible through other means.",
  },

  // ─── Input image ──────────────────────────────────────────────────────────
  inp_img_01b: {
    id: "inp_img_01b",
    title: "Graphic Button Missing Alt Text",
    description:
      'An <input type="image"> element has no alt attribute. The image button has no accessible name.',
    wcagCriteria: ["1.1.1", "4.1.2"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/inp_img_01b.html",
    fix: 'Add alt="<action description>" to the <input type="image"> element, e.g. alt="Search".',
  },

  // ─── Input (additional) ───────────────────────────────────────────────────
  input_02: {
    id: "input_02",
    title: "Form Control Missing Accessible Name",
    description:
      "A form control has no accessible name via label, aria-label, aria-labelledby, title, or placeholder. Users cannot determine the purpose of the field.",
    wcagCriteria: ["4.1.2", "1.3.1"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/input_02.html",
    fix: "Associate a <label> with the control, or add aria-label, aria-labelledby, or title.",
  },
  input_03: {
    id: "input_03",
    title: "Inappropriate Alt on Input Element",
    description:
      'An <input> element other than type="image" has an alt attribute. The alt attribute is only valid on <input type="image">.',
    wcagCriteria: ["4.1.2"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/input_03.html",
    fix: "Remove the alt attribute from this input. Use aria-label or a <label> element instead.",
  },

  // ─── Label (additional) ───────────────────────────────────────────────────
  label_03: {
    id: "label_03",
    title: "Accessible Name Does Not Match Visible Label",
    description:
      "A form control's programmatic accessible name (aria-label) does not contain the visible label text. Speech-input users who speak the visible label will fail to activate the control.",
    wcagCriteria: ["2.5.3"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/label_03.html",
    fix: "Ensure the aria-label value contains the visible label text. Ideally, start the aria-label with the visible text.",
  },

  // ─── Landmarks (additional) ───────────────────────────────────────────────
  landmark_10: {
    id: "landmark_10",
    title: "Duplicate Banner Landmark",
    description:
      'The page has more than one <header> or role="banner" element at the top level. There should be only one banner landmark.',
    wcagCriteria: ["1.3.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/landmark_10.html",
    fix: "Keep only one top-level banner landmark. Nest others inside sectioning elements.",
  },
  landmark_12: {
    id: "landmark_12",
    title: "Duplicate Contentinfo Landmark",
    description:
      'The page has more than one <footer> or role="contentinfo" element at the top level. There should be only one contentinfo landmark.',
    wcagCriteria: ["1.3.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/landmark_12.html",
    fix: "Keep only one top-level contentinfo landmark. Nest others inside sectioning elements.",
  },

  // ─── Lists (additional) ───────────────────────────────────────────────────
  list_01: {
    id: "list_01",
    title: "Invalid Direct Child of List Element",
    description:
      "A <ul> or <ol> element contains a direct child that is not a <li>, <script>, or <template>. This is invalid HTML that may confuse assistive technologies.",
    wcagCriteria: ["1.3.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/list_01.html",
    fix: "Wrap direct children of <ul>/<ol> in <li> elements.",
  },
  list_03: {
    id: "list_03",
    title: "Definition List Structure Invalid",
    description:
      "A <dl> element contains a direct child that is not a <dt>, <dd>, <div>, <script>, or <template>. This is invalid HTML.",
    wcagCriteria: ["1.3.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/list_03.html",
    fix: "Ensure all direct children of <dl> are <dt>, <dd>, or <div> elements.",
  },

  // ─── Meta (additional) ────────────────────────────────────────────────────
  meta_02: {
    id: "meta_02",
    title: "Automatic Page Redirect",
    description:
      'The page uses <meta http-equiv="refresh" content="0;url=…"> for an immediate redirect. Server-side redirects (301/302) are preferred.',
    wcagCriteria: ["3.2.5"],
    wcagLevel: "AAA",
    severity: "notice",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/meta_02.html",
    fix: "Use a server-side redirect (HTTP 301/302) instead of a meta refresh redirect.",
  },
  meta_04: {
    id: "meta_04",
    title: "Delayed Page Refresh",
    description:
      'The page uses <meta http-equiv="refresh"> with a delay greater than 0. Users are not in control of the page refresh timing.',
    wcagCriteria: ["2.2.1", "2.2.4", "3.2.5"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/meta_04.html",
    fix: "Remove the meta refresh or let the user control the refresh. Notify users before the page refreshes.",
  },

  // ─── Object ───────────────────────────────────────────────────────────────
  object_02: {
    id: "object_02",
    title: "Object Missing Accessible Name",
    description:
      "An <object> element has no accessible name (no aria-label, aria-labelledby, or title). Screen readers cannot describe the embedded content.",
    wcagCriteria: ["1.1.1"],
    wcagLevel: "A",
    severity: "error",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/object_02.html",
    fix: 'Add aria-label="<description>" or title="<description>" to the <object> element.',
  },

  // ─── Scope ────────────────────────────────────────────────────────────────
  scope_01: {
    id: "scope_01",
    title: "Scope Attribute on Non-Header Cell",
    description:
      "A scope attribute is used on a <td> element instead of a <th>. The scope attribute is only meaningful on table header cells.",
    wcagCriteria: ["1.3.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/scope_01.html",
    fix: "Move the scope attribute to a <th> element, or change the <td> to <th> if it functions as a header.",
  },

  // ─── Title (additional) ───────────────────────────────────────────────────
  title_04: {
    id: "title_04",
    title: "Inappropriate Page Title Length",
    description:
      "The <title> element content is too short (less than 2 characters) or too long (more than 150 characters). Titles should be concise but descriptive.",
    wcagCriteria: ["2.4.2"],
    wcagLevel: "A",
    severity: "notice",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/title_04.html",
    fix: "Write a concise, descriptive title between 2 and 150 characters.",
  },
  title_05: {
    id: "title_05",
    title: "Page Title Contains Special Characters",
    description:
      "The <title> element contains ASCII control characters, excessive punctuation, or non-descriptive characters that may confuse screen reader users.",
    wcagCriteria: ["2.4.2"],
    wcagLevel: "A",
    severity: "notice",
    helpUrl:
      "https://amagovpt.github.io/accessmonitor-rulesets/en/title_05.html",
    fix: "Remove special characters, control characters, or excessive punctuation from the page title.",
  },

  // ─── Window ───────────────────────────────────────────────────────────────
  win_01: {
    id: "win_01",
    title: "JavaScript URI in Link",
    description:
      "A link uses javascript: as its href value. This is not keyboard accessible and prevents right-click functionality.",
    wcagCriteria: ["2.1.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl: "https://amagovpt.github.io/accessmonitor-rulesets/en/win_01.html",
    fix: "Replace javascript: URIs with proper href values and use event listeners. Use <button> for actions.",
  },

  // ─── Focus Visible ──────────────────────────────────────────────────────
  focus_visible_01: {
    id: "focus_visible_01",
    title: "Focus Outline Removed Without Alternative",
    description:
      "An element has outline: none or outline: 0 in inline styles without providing an alternative visible focus indicator.",
    wcagCriteria: ["2.4.7"],
    wcagLevel: "AA",
    severity: "warning",
    helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html",
    fix: "Do not remove the focus outline unless you provide an alternative visible focus indicator (e.g., box-shadow, border, background-color change).",
  },

  // ─── Error Identification ───────────────────────────────────────────────
  error_id_01: {
    id: "error_id_01",
    title: "aria-invalid Without Error Message",
    description:
      "A form control has aria-invalid but no associated error description via aria-errormessage or aria-describedby.",
    wcagCriteria: ["3.3.1"],
    wcagLevel: "A",
    severity: "warning",
    helpUrl:
      "https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html",
    fix: "Add aria-errormessage or aria-describedby referencing an element that describes the error.",
  },

  // ─── Status Messages ───────────────────────────────────────────────────
  status_msg_01: {
    id: "status_msg_01",
    title: "Status Role Without Live Region",
    description:
      'An element has role="status" or role="alert" but no aria-live attribute. While these roles have implicit aria-live values, explicitly setting aria-live ensures broader assistive technology support.',
    wcagCriteria: ["4.1.3"],
    wcagLevel: "AA",
    severity: "notice",
    helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html",
    fix: 'Add aria-live="polite" for role="status" or aria-live="assertive" for role="alert" to ensure status messages are announced by assistive technologies.',
  },
};

export const RULE_IDS = Object.keys(RULES);

// ─── Shared constants (deduplicated) ─────────────────────────────────────────

export const VALID_ROLES = new Set([
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

export const VALID_ARIA_ATTRS = new Set([
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

export const REQUIRED_ARIA: Record<string, string[]> = {
  combobox: ["aria-expanded"],
  slider: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
  spinbutton: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
  scrollbar: [
    "aria-valuenow",
    "aria-valuemin",
    "aria-valuemax",
    "aria-controls",
  ],
  option: ["aria-selected"],
};

export const NON_INTERACTIVE_TAGS = new Set([
  "div",
  "span",
  "p",
  "section",
  "article",
  "li",
  "ul",
  "ol",
  "header",
  "footer",
  "main",
  "aside",
  "nav",
  "figure",
]);

export const INTERACTIVE_ROLES = new Set([
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

/** ARIA attributes that accept only true/false. */
export const ARIA_BOOLEAN_ATTRS = new Set([
  "aria-atomic",
  "aria-busy",
  "aria-disabled",
  "aria-grabbed",
  "aria-hidden",
  "aria-modal",
  "aria-multiline",
  "aria-multiselectable",
  "aria-readonly",
  "aria-required",
]);

/** ARIA attributes that accept a specific set of token values. */
export const ARIA_TOKEN_VALUES: Record<string, Set<string>> = {
  "aria-autocomplete": new Set(["inline", "list", "both", "none"]),
  "aria-checked": new Set(["true", "false", "mixed", "undefined"]),
  "aria-current": new Set([
    "page",
    "step",
    "location",
    "date",
    "time",
    "true",
    "false",
  ]),
  "aria-dropeffect": new Set([
    "copy",
    "execute",
    "link",
    "move",
    "none",
    "popup",
  ]),
  "aria-expanded": new Set(["true", "false", "undefined"]),
  "aria-haspopup": new Set([
    "true",
    "false",
    "menu",
    "listbox",
    "tree",
    "grid",
    "dialog",
  ]),
  "aria-invalid": new Set(["true", "false", "grammar", "spelling"]),
  "aria-live": new Set(["assertive", "off", "polite"]),
  "aria-orientation": new Set(["horizontal", "vertical", "undefined"]),
  "aria-pressed": new Set(["true", "false", "mixed", "undefined"]),
  "aria-relevant": new Set(["additions", "all", "removals", "text"]),
  "aria-selected": new Set(["true", "false", "undefined"]),
  "aria-sort": new Set(["ascending", "descending", "none", "other"]),
};

/** Focusable element selectors for HTML. */
export const FOCUSABLE_SELECTORS =
  'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex], audio[controls], video[controls], details, summary, iframe, object, embed, [contenteditable]';
