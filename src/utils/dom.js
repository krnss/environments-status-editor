const TEXTAREA_SELECTORS = [
  ".we-ta-container textarea",
  "div.we-ta-container textarea",
  "#skip-to-main-content > div > div > div > div.vss-Splitter--pane-flexible.relative > div > div.we-text-preview-container.flex-row.flex-grow.edit-and-preview > div.droptarget-container.we-ta-container.flex-column.we-ta-container > div > div > textarea",
  "textarea",
];

const PREVIEW_SELECTORS = [
  ".markdown-preview",
  "div.markdown-preview.relative > div > div",
  "#skip-to-main-content > div > div > div > div.vss-Splitter--pane-flexible.relative > div > div.we-text-preview-container.flex-row.flex-grow.edit-and-preview > div.markdown-preview.relative > div > div",
];

function queryFirst(selectors) {
  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector);
      if (el) return el;
    } catch {
      // invalid selector — skip
    }
  }
  return null;
}

export function findWikiTextarea() {
  return queryFirst(TEXTAREA_SELECTORS);
}

export function findWikiPreview() {
  return queryFirst(PREVIEW_SELECTORS);
}

/**
 * Detect whether we are on the environments wiki (edit or view).
 */
export function isEnvironmentsWikiPage() {
  const href = (location.href || "").toLowerCase();
  const pathOk =
    href.includes("wiki") &&
    (href.includes("environment") ||
      href.includes("etimeplus") ||
      href.includes("dev%20environments") ||
      href.includes("dev-environments") ||
      href.includes("dev_environments"));

  const titleEl =
    document.querySelector(".wiki-page-title, .page-title, h1, [aria-label*='etimeplus']") ||
    document.querySelector("input[aria-label='Title'], input[placeholder*='Title']");

  const titleText = (
    titleEl?.value ||
    titleEl?.textContent ||
    document.title ||
    ""
  ).toLowerCase();

  const titleOk =
    titleText.includes("environment") ||
    (titleText.includes("etimeplus") && titleText.includes("dev"));

  // Also accept if edit textarea already contains our known table headers
  const textarea = findWikiTextarea();
  const contentOk =
    !!textarea?.value &&
    /<table[\s>]/i.test(textarea.value) &&
    /Name/i.test(textarea.value) &&
    /Developer/i.test(textarea.value) &&
    /Status/i.test(textarea.value);

  return pathOk || titleOk || contentOk;
}

export function isWikiEditMode() {
  const textarea = findWikiTextarea();
  return !!(textarea && textarea.offsetParent !== null);
}

/**
 * Write HTML into the wiki textarea and notify ADO so preview updates.
 */
export function writeWikiTextarea(value) {
  const textarea = findWikiTextarea();
  if (!textarea) return false;

  const proto = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value"
  );
  if (proto?.set) {
    proto.set.call(textarea, value);
  } else {
    textarea.value = value;
  }

  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.dispatchEvent(new Event("change", { bubbles: true }));

  // Some ADO editors listen for keyboard-like events
  textarea.dispatchEvent(
    new InputEvent("input", { bubbles: true, inputType: "insertText", data: null })
  );

  return true;
}

export function readWikiTextarea() {
  const textarea = findWikiTextarea();
  return textarea ? textarea.value : "";
}
