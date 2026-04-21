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
    wcagCriteria: ["4.1.1"],
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
    wcagCriteria: ["1.3.3"],
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
};

export const RULE_IDS = Object.keys(RULES);
