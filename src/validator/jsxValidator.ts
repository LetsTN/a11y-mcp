import * as vscode from "vscode";
import { parse } from "@babel/parser";
import type { A11yIssue, ValidationResult, ComponentMap } from "./types";
import {
  RULES,
  VALID_ROLES,
  NON_INTERACTIVE_TAGS,
  ARIA_BOOLEAN_ATTRS,
  ARIA_TOKEN_VALUES,
} from "./rules";
import { computeStats } from "../utils";

// ─── Minimal AST typings (to avoid needing @babel/types as a dep) ─────────────

interface BabelLocation {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

interface BabelNode {
  type: string;
  loc?: BabelLocation;
  [key: string]: unknown;
}

interface JSXIdentifier extends BabelNode {
  type: "JSXIdentifier";
  name: string;
}

interface JSXMemberExpression extends BabelNode {
  type: "JSXMemberExpression";
  object: JSXIdentifier | JSXMemberExpression;
  property: JSXIdentifier;
}

interface JSXNamespacedName extends BabelNode {
  type: "JSXNamespacedName";
  namespace: JSXIdentifier;
  name: JSXIdentifier;
}

interface StringLiteral extends BabelNode {
  type: "StringLiteral";
  value: string;
}

interface JSXEmptyExpression extends BabelNode {
  type: "JSXEmptyExpression";
}

interface JSXExpressionContainer extends BabelNode {
  type: "JSXExpressionContainer";
  expression: BabelNode | JSXEmptyExpression;
}

interface JSXAttribute extends BabelNode {
  type: "JSXAttribute";
  name: JSXIdentifier | JSXNamespacedName;
  value: StringLiteral | JSXExpressionContainer | JSXElement | null;
}

interface JSXSpreadAttribute extends BabelNode {
  type: "JSXSpreadAttribute";
}

interface JSXOpeningElement extends BabelNode {
  type: "JSXOpeningElement";
  name: JSXIdentifier | JSXMemberExpression | JSXNamespacedName;
  attributes: Array<JSXAttribute | JSXSpreadAttribute>;
  selfClosing: boolean;
}

interface JSXText extends BabelNode {
  type: "JSXText";
  value: string;
}

interface JSXElement extends BabelNode {
  type: "JSXElement";
  openingElement: JSXOpeningElement;
  children: Array<JSXElement | JSXExpressionContainer | JSXText | BabelNode>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Recursively walk a babel AST node. */
function traverse(node: unknown, visitor: (n: BabelNode) => void): void {
  if (!node || typeof node !== "object") return;
  const n = node as BabelNode;
  if (n.type) visitor(n);
  for (const key of Object.keys(n)) {
    const child = n[key];
    if (Array.isArray(child)) {
      child.forEach((c) => traverse(c, visitor));
    } else if (
      child &&
      typeof child === "object" &&
      (child as BabelNode).type
    ) {
      traverse(child, visitor);
    }
  }
}

/** Resolve the lowercase tag name of a JSXOpeningElement, or null for components. */
function getTagName(opening: JSXOpeningElement): string | null {
  const name = opening.name;
  if (name.type === "JSXIdentifier") {
    const n = (name as JSXIdentifier).name;
    // Lowercase first char = HTML element; Uppercase = React component
    return n[0] === n[0].toLowerCase() ? n.toLowerCase() : null;
  }
  return null;
}

/** Extract the component name from a JSXOpeningElement (uppercase identifiers and member expressions). */
function getComponentName(opening: JSXOpeningElement): string | null {
  const name = opening.name;
  if (name.type === "JSXIdentifier") {
    const n = (name as JSXIdentifier).name;
    return n[0] === n[0].toUpperCase() ? n : null;
  }
  if (name.type === "JSXMemberExpression") {
    return getMemberExpressionName(name as JSXMemberExpression);
  }
  return null;
}

function getMemberExpressionName(node: JSXMemberExpression): string {
  const prop = node.property.name;
  if (node.object.type === "JSXIdentifier") {
    return `${(node.object as JSXIdentifier).name}.${prop}`;
  }
  return `${getMemberExpressionName(node.object as JSXMemberExpression)}.${prop}`;
}

/** Resolve a component to its native HTML tag using the component map.
 *  Returns { tag, propMap } for mapped components, { tag } for native elements, or null. */
function resolveElement(
  opening: JSXOpeningElement,
  componentMap: ComponentMap,
): { tag: string; propMap?: Record<string, string> } | null {
  const nativeTag = getTagName(opening);
  if (nativeTag) return { tag: nativeTag };

  const componentName = getComponentName(opening);
  if (!componentName) return null;

  // Try full name (e.g. "Mui.Button"), then short name (e.g. "Button")
  const mapping =
    componentMap[componentName] ??
    (componentName.includes(".")
      ? componentMap[componentName.split(".").pop()!]
      : undefined);
  if (!mapping) return null;

  return { tag: mapping.as, propMap: mapping.propMap };
}

/**
 * Create a resolved attributes map that adds standard HTML attribute names
 * alongside the component's prop names. Existing attrs.get("aria-label") calls
 * will find the value even if the component uses "ariaLabel" as prop name.
 */
function resolveAttrs(
  attrs: Map<string, JSXAttribute>,
  propMap?: Record<string, string>,
): Map<string, JSXAttribute> {
  if (!propMap) return attrs;
  const resolved = new Map(attrs);
  for (const [standardName, componentProp] of Object.entries(propMap)) {
    const attr = attrs.get(componentProp);
    if (attr && !resolved.has(standardName)) {
      resolved.set(standardName, attr);
    }
  }
  return resolved;
}

/** Get all JSXAttribute nodes indexed by name. */
function getAttrs(opening: JSXOpeningElement): Map<string, JSXAttribute> {
  const map = new Map<string, JSXAttribute>();
  for (const attr of opening.attributes) {
    if (attr.type !== "JSXAttribute") continue;
    const a = attr as JSXAttribute;
    let attrName: string;
    if (a.name.type === "JSXIdentifier") {
      attrName = (a.name as JSXIdentifier).name;
    } else {
      // JSXNamespacedName: e.g. xml:lang
      const ns = a.name as JSXNamespacedName;
      attrName = `${ns.namespace.name}:${ns.name.name}`;
    }
    map.set(attrName, a);
  }
  return map;
}

/** Get the string value of an attribute (if it's a string literal). Returns null for expressions. */
function getAttrString(attr: JSXAttribute | undefined): string | null {
  if (!attr) return null;
  if (attr.value === null) return ""; // boolean attribute like `controls`
  if (attr.value.type === "StringLiteral")
    return (attr.value as StringLiteral).value;
  return null; // JSXExpressionContainer — can't statically determine
}

/** Determine if a JSX element has an accessible name.
 *  Returns 'yes' | 'no' | 'maybe' (for dynamic expressions we can't evaluate). */
function hasAccessibleName(
  el: JSXElement,
  propMap?: Record<string, string>,
): "yes" | "no" | "maybe" {
  const rawAttrs = getAttrs(el.openingElement);
  const attrs = resolveAttrs(rawAttrs, propMap);

  const ariaLabel = attrs.get("aria-label");
  if (ariaLabel) {
    const val = getAttrString(ariaLabel);
    if (val === null) return "maybe"; // dynamic expression
    if (val.trim()) return "yes";
  }
  const ariaLabelledBy = attrs.get("aria-labelledby");
  if (ariaLabelledBy) {
    const val = getAttrString(ariaLabelledBy);
    if (val === null) return "maybe";
    if (val.trim()) return "yes";
  }
  const title = attrs.get("title");
  if (title) {
    const val = getAttrString(title);
    if (val === null) return "maybe";
    if (val.trim()) return "yes";
  }

  // Check children for text content or expressions
  for (const child of el.children) {
    if (child.type === "JSXText") {
      if ((child as JSXText).value.trim()) return "yes";
    } else if (child.type === "JSXExpressionContainer") {
      const expr = (child as JSXExpressionContainer).expression;
      if (expr.type !== "JSXEmptyExpression") return "maybe"; // dynamic text
    } else if (child.type === "JSXElement") {
      // Has child element — assume it may contribute accessible name
      return "maybe";
    }
  }
  return "no";
}

function makeIssue(
  ruleId: string,
  message: string,
  node: BabelNode,
): A11yIssue {
  const rule = RULES[ruleId];
  const line = node.loc?.start.line ?? 1;
  const column = (node.loc?.start.column ?? 0) + 1;
  return {
    ruleId,
    severity: rule.severity,
    wcagCriteria: rule.wcagCriteria,
    wcagLevel: rule.wcagLevel,
    message,
    element: `(JSX element at line ${line})`,
    selector: `line ${line}`,
    line,
    column,
    fix: rule.fix,
    helpUrl: rule.helpUrl,
  };
}

// ─── Rule checkers ────────────────────────────────────────────────────────────

function checkJsxElement(
  el: JSXElement,
  issues: A11yIssue[],
  componentMap: ComponentMap,
): void {
  const resolved = resolveElement(el.openingElement, componentMap);
  if (!resolved) return;
  const { tag, propMap } = resolved;

  const rawAttrs = getAttrs(el.openingElement);
  const attrs = resolveAttrs(rawAttrs, propMap);

  // ── Images ──────────────────────────────────────────────────────────────
  if (tag === "img") {
    const altAttr = attrs.get("alt");
    if (!altAttr) {
      issues.push(
        makeIssue(
          "img_01b",
          vscode.l10n.t("<img> is missing the required alt prop."),
          el,
        ),
      );
    } else {
      const altVal = getAttrString(altAttr);
      if (altVal !== null) {
        if (
          /^(image|img|photo|foto|picture|icon|graphic)\s*$/i.test(altVal) ||
          /\.(png|jpe?g|gif|svg|webp|bmp)$/i.test(altVal)
        ) {
          issues.push(
            makeIssue(
              "img_03",
              vscode.l10n.t(
                '<img alt="{0}"> has an uninformative alt value.',
                altVal,
              ),
              el,
            ),
          );
        }
        if (altVal.length > 100) {
          issues.push(
            makeIssue(
              "img_04",
              vscode.l10n.t(
                "<img> alt text is {0} characters (max recommended: 100).",
                altVal.length,
              ),
              el,
            ),
          );
        }
      }
    }
  }

  // ── Anchors ─────────────────────────────────────────────────────────────
  if (tag === "a") {
    const result = hasAccessibleName(el, propMap);
    if (result === "no") {
      issues.push(
        makeIssue(
          "a_11",
          vscode.l10n.t(
            "<a> element has no accessible name (no children, aria-label, or title).",
          ),
          el,
        ),
      );
    }
  }

  // ── Buttons ─────────────────────────────────────────────────────────────
  if (tag === "button") {
    const result = hasAccessibleName(el, propMap);
    if (result === "no") {
      issues.push(
        makeIssue(
          "button_02",
          vscode.l10n.t("<button> element has no accessible name."),
          el,
        ),
      );
    }
  }

  // ── Inputs ──────────────────────────────────────────────────────────────
  if (tag === "input") {
    const typeAttr =
      getAttrString(
        attrs.get("type") ?? (undefined as unknown as JSXAttribute),
      ) ?? "text";
    const SKIP_TYPES = new Set([
      "hidden",
      "submit",
      "reset",
      "button",
      "image",
    ]);
    if (!SKIP_TYPES.has(typeAttr.toLowerCase())) {
      const ariaLabel = getAttrString(attrs.get("aria-label"));
      const ariaLabelledBy = getAttrString(attrs.get("aria-labelledby"));
      const id = getAttrString(attrs.get("id"));
      const title = getAttrString(attrs.get("title"));
      const hasExprAriaLabel =
        attrs.get("aria-label")?.value?.type === "JSXExpressionContainer";
      const hasExprAriaLabelledBy =
        attrs.get("aria-labelledby")?.value?.type === "JSXExpressionContainer";

      if (
        !ariaLabel?.trim() &&
        !ariaLabelledBy?.trim() &&
        !id &&
        !title &&
        !hasExprAriaLabel &&
        !hasExprAriaLabelledBy
      ) {
        issues.push(
          makeIssue(
            "input_01",
            vscode.l10n.t(
              '<input type="{0}"> has no id (for <label htmlFor>), aria-label, aria-labelledby, or title.',
              typeAttr,
            ),
            el,
          ),
        );
      }
    }
  }

  // ── Select ──────────────────────────────────────────────────────────────
  if (tag === "select") {
    const ariaLabel = getAttrString(attrs.get("aria-label"));
    const ariaLabelledBy = getAttrString(attrs.get("aria-labelledby"));
    const id = getAttrString(attrs.get("id"));
    const hasExpr =
      attrs.get("aria-label")?.value?.type === "JSXExpressionContainer" ||
      attrs.get("aria-labelledby")?.value?.type === "JSXExpressionContainer";
    if (!ariaLabel?.trim() && !ariaLabelledBy?.trim() && !id && !hasExpr) {
      issues.push(
        makeIssue(
          "input_01",
          vscode.l10n.t(
            "<select> has no id (for <label htmlFor>), aria-label, or aria-labelledby.",
          ),
          el,
        ),
      );
    }
  }

  // ── Textarea ─────────────────────────────────────────────────────────────
  if (tag === "textarea") {
    const ariaLabel = getAttrString(attrs.get("aria-label"));
    const ariaLabelledBy = getAttrString(attrs.get("aria-labelledby"));
    const id = getAttrString(attrs.get("id"));
    const hasExpr =
      attrs.get("aria-label")?.value?.type === "JSXExpressionContainer" ||
      attrs.get("aria-labelledby")?.value?.type === "JSXExpressionContainer";
    if (!ariaLabel?.trim() && !ariaLabelledBy?.trim() && !id && !hasExpr) {
      issues.push(
        makeIssue(
          "input_01",
          vscode.l10n.t(
            "<textarea> has no id (for <label htmlFor>), aria-label, or aria-labelledby.",
          ),
          el,
        ),
      );
    }
  }

  // ── Iframe ──────────────────────────────────────────────────────────────
  if (tag === "iframe") {
    const titleAttr = attrs.get("title");
    const titleVal = getAttrString(titleAttr);
    if (!titleAttr || (titleVal !== null && !titleVal.trim())) {
      issues.push(
        makeIssue(
          "iframe_01",
          vscode.l10n.t("<iframe> is missing a title prop."),
          el,
        ),
      );
    }
  }

  // ── SVG ─────────────────────────────────────────────────────────────────
  if (tag === "svg") {
    const isHidden = getAttrString(attrs.get("aria-hidden")) === "true";
    const role = getAttrString(attrs.get("role")) ?? "";
    if (!isHidden && role !== "presentation" && role !== "none") {
      const ariaLabel = getAttrString(attrs.get("aria-label"))?.trim();
      const ariaLabelledBy = getAttrString(
        attrs.get("aria-labelledby"),
      )?.trim();
      const hasExprLabel =
        attrs.get("aria-label")?.value?.type === "JSXExpressionContainer" ||
        attrs.get("aria-labelledby")?.value?.type === "JSXExpressionContainer";
      const hasTitleChild = el.children.some(
        (c) =>
          c.type === "JSXElement" &&
          getTagName((c as JSXElement).openingElement) === "title",
      );
      if (!ariaLabel && !ariaLabelledBy && !hasExprLabel && !hasTitleChild) {
        issues.push(
          makeIssue(
            "svg_02",
            vscode.l10n.t(
              '<svg> has no accessible name. Add aria-hidden="true" if decorative, or aria-label / a <title> child if meaningful.',
            ),
            el,
          ),
        );
      }
    }
  }

  // ── tabIndex > 0 ─────────────────────────────────────────────────────────
  const tabIndexAttr = attrs.get("tabIndex");
  if (tabIndexAttr) {
    const val = getAttrString(tabIndexAttr);
    if (val !== null && parseInt(val, 10) > 0) {
      issues.push(
        makeIssue(
          "element_01",
          vscode.l10n.t(
            'tabIndex="{0}" > 0 creates an unpredictable tab order.',
            val,
          ),
          el,
        ),
      );
    }
  }

  // ── onClick on non-interactive element ──────────────────────────────────

  if (NON_INTERACTIVE_TAGS.has(tag) && attrs.has("onClick")) {
    const role = getAttrString(attrs.get("role")) ?? "";
    const hasTabIndex = attrs.has("tabIndex") || attrs.has("tabindex");
    const hasKeyHandler =
      attrs.has("onKeyDown") || attrs.has("onKeyUp") || attrs.has("onKeyPress");
    if (!role || (!hasTabIndex && !hasKeyHandler)) {
      issues.push(
        makeIssue(
          "jsx_onclick_div",
          vscode.l10n.t(
            "<{0}> has onClick but no role, tabIndex, or keyboard handler. Keyboard users cannot interact with it.",
            tag,
          ),
          el,
        ),
      );
    }
  }

  // ── onMouseOver without onFocus ──────────────────────────────────────────
  if (attrs.has("onMouseOver") && !attrs.has("onFocus")) {
    issues.push(
      makeIssue(
        "ehandler_04",
        vscode.l10n.t(
          "<{0}> has onMouseOver without onFocus. Keyboard users cannot trigger this interaction.",
          tag,
        ),
        el,
      ),
    );
  }
  if (attrs.has("onMouseOut") && !attrs.has("onBlur")) {
    issues.push(
      makeIssue(
        "ehandler_04",
        vscode.l10n.t(
          "<{0}> has onMouseOut without onBlur. Keyboard users cannot trigger this interaction.",
          tag,
        ),
        el,
      ),
    );
  }

  // ── Invalid ARIA role ────────────────────────────────────────────────────
  const roleAttr = attrs.get("role");
  if (roleAttr) {
    const roleVal = getAttrString(roleAttr);
    if (roleVal !== null) {
      for (const r of roleVal.trim().split(/\s+/)) {
        if (r && !VALID_ROLES.has(r)) {
          issues.push(
            makeIssue(
              "aria_01",
              vscode.l10n.t('role="{0}" is not a valid WAI-ARIA role.', r),
              el,
            ),
          );
        }
      }
    }
  }

  // ── Invalid ARIA boolean/token values (aria_04) ─────────────────────────
  for (const [attrName, attrNode] of attrs) {
    if (!attrName.startsWith("aria-")) continue;
    const val = getAttrString(attrNode);
    if (val === null) continue; // dynamic expression
    const normalized = val.trim().toLowerCase();
    if (!normalized) continue;

    if (ARIA_BOOLEAN_ATTRS.has(attrName)) {
      if (normalized !== "true" && normalized !== "false") {
        issues.push(
          makeIssue(
            "aria_04",
            vscode.l10n.t(
              '{0}="{1}" is not valid. Expected "true" or "false".',
              attrName,
              val,
            ),
            el,
          ),
        );
      }
    }
    const tokenSet = ARIA_TOKEN_VALUES[attrName];
    if (tokenSet && !tokenSet.has(normalized)) {
      issues.push(
        makeIssue(
          "aria_04",
          vscode.l10n.t(
            '{0}="{1}" is not a valid value. Allowed: {2}.',
            attrName,
            val,
            [...tokenSet].join(", "),
          ),
          el,
        ),
      );
    }
  }

  // ── aria-hidden on focusable elements (element_02 / element_03) ─────────
  const ariaHiddenVal = getAttrString(attrs.get("aria-hidden"));
  if (ariaHiddenVal === "true") {
    const FOCUSABLE_JSX_TAGS = new Set([
      "a",
      "button",
      "input",
      "select",
      "textarea",
      "iframe",
    ]);
    if (FOCUSABLE_JSX_TAGS.has(tag)) {
      const tabIdx = getAttrString(attrs.get("tabIndex"));
      if (tabIdx === null || parseInt(tabIdx, 10) >= 0) {
        issues.push(
          makeIssue(
            "element_03",
            vscode.l10n.t(
              '<{0}> is focusable but has aria-hidden="true". Screen readers will not announce it.',
              tag,
            ),
            el,
          ),
        );
      }
    }
  }

  // ── Input type="image" without alt (inp_img_01b) ────────────────────────
  if (tag === "input") {
    const typeVal = (
      getAttrString(
        attrs.get("type") ?? (undefined as unknown as JSXAttribute),
      ) ?? "text"
    ).toLowerCase();
    if (typeVal === "image") {
      const alt = getAttrString(attrs.get("alt"));
      if (alt === null || alt === undefined) {
        if (!attrs.has("alt")) {
          issues.push(
            makeIssue(
              "inp_img_01b",
              vscode.l10n.t('<input type="image"> is missing the alt prop.'),
              el,
            ),
          );
        }
      } else if (!alt.trim()) {
        issues.push(
          makeIssue(
            "inp_img_01b",
            vscode.l10n.t('<input type="image"> has empty alt text.'),
            el,
          ),
        );
      }
    }
  }

  // ── Object without accessible name (object_02) ─────────────────────────
  if (tag === "object") {
    const ariaHidden = getAttrString(attrs.get("aria-hidden")) === "true";
    if (!ariaHidden) {
      const ariaLabel = getAttrString(attrs.get("aria-label"))?.trim();
      const ariaLabelledBy = getAttrString(
        attrs.get("aria-labelledby"),
      )?.trim();
      const titleVal = getAttrString(attrs.get("title"))?.trim();
      const hasExpr =
        attrs.get("aria-label")?.value?.type === "JSXExpressionContainer" ||
        attrs.get("aria-labelledby")?.value?.type === "JSXExpressionContainer";
      if (!ariaLabel && !ariaLabelledBy && !titleVal && !hasExpr) {
        issues.push(
          makeIssue(
            "object_02",
            vscode.l10n.t(
              "<object> has no accessible name (no aria-label, aria-labelledby, or title).",
            ),
            el,
          ),
        );
      }
    }
  }

  // ── Video/Audio with autoplay (audio_video_02) ──────────────────────────
  if (tag === "video" || tag === "audio") {
    if (attrs.has("autoPlay") || attrs.has("autoplay")) {
      const muted = attrs.has("muted");
      if (!muted) {
        issues.push(
          makeIssue(
            "audio_video_02",
            vscode.l10n.t(
              "<{0}> has autoPlay without muted. Automatic audio can disorient users.",
              tag,
            ),
            el,
          ),
        );
      }
    }
  }

  // ── Fieldset without legend (field_01) ──────────────────────────────────
  if (tag === "fieldset") {
    const hasLegend = el.children.some(
      (c) =>
        c.type === "JSXElement" &&
        getTagName((c as JSXElement).openingElement) === "legend",
    );
    if (!hasLegend) {
      issues.push(
        makeIssue(
          "field_01",
          vscode.l10n.t("<fieldset> has no <legend> element."),
          el,
        ),
      );
    }
  }

  // ── Focus Visible — outline removed without alternative (focus_visible_01)
  const styleAttr = attrs.get("style");
  if (styleAttr) {
    const styleVal = getAttrString(styleAttr);
    if (styleVal) {
      const styleLower = styleVal.toLowerCase();
      if (
        /outline\s*:\s*(none|0(px)?)\b/.test(styleLower) &&
        !/box-shadow|border\s*:|background-color\s*:/.test(styleLower)
      ) {
        issues.push(
          makeIssue(
            "focus_visible_01",
            vscode.l10n.t(
              "Element removes focus outline (outline: none/0) without providing an alternative visible focus indicator.",
            ),
            el,
          ),
        );
      }
    }
  }

  // ── Error Identification — aria-invalid without error message (error_id_01)
  const ariaInvalid = attrs.get("aria-invalid");
  if (ariaInvalid) {
    const invalidVal = getAttrString(ariaInvalid);
    if (invalidVal === "true") {
      const errMsg = attrs.get("aria-errormessage");
      const describedBy = attrs.get("aria-describedby");
      const hasErrMsg = errMsg ? (getAttrString(errMsg) ?? "").trim() : "";
      const hasDescBy = describedBy
        ? (getAttrString(describedBy) ?? "").trim()
        : "";
      if (!hasErrMsg && !hasDescBy) {
        issues.push(
          makeIssue(
            "error_id_01",
            vscode.l10n.t(
              'Element has aria-invalid="true" but no aria-errormessage or aria-describedby to describe the error.',
            ),
            el,
          ),
        );
      }
    }
  }

  // ── Status Messages — role="status"/"alert" without aria-live (status_msg_01)
  const statusRoleAttr = attrs.get("role");
  if (statusRoleAttr) {
    const roleVal = getAttrString(statusRoleAttr);
    if (roleVal === "status" || roleVal === "alert") {
      const ariaLive = attrs.get("aria-live");
      const liveVal = ariaLive ? (getAttrString(ariaLive) ?? "").trim() : "";
      if (!liveVal) {
        issues.push(
          makeIssue(
            "status_msg_01",
            vscode.l10n.t(
              'Element with role="{0}" has no explicit aria-live attribute. Add aria-live="{1}" for broader assistive technology support.',
              roleVal,
              roleVal === "alert" ? "assertive" : "polite",
            ),
            el,
          ),
        );
      }
    }
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function validateJsx(
  code: string,
  filePath: string,
  componentMap: ComponentMap = {},
): ValidationResult {
  const issues: A11yIssue[] = [];

  let ast: BabelNode;
  try {
    ast = parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
      errorRecovery: true,
      // Preserve source locations
      ranges: false,
    }) as unknown as BabelNode;
  } catch {
    // If parsing fails (e.g., unsupported syntax), return empty result
    return {
      filePath,
      issues: [],
      stats: { errors: 0, warnings: 0, notices: 0, total: 0 },
    };
  }

  traverse(ast, (node) => {
    if (node.type === "JSXElement") {
      checkJsxElement(node as unknown as JSXElement, issues, componentMap);
    }
  });

  return {
    filePath,
    issues,
    stats: computeStats(issues),
  };
}
