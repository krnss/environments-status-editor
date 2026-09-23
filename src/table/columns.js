import { resolveColorName } from "../utils/css-colors.js";

export const COLUMNS = {
  NAME: 0,
  REPOSITORY: 1,
  BRANCH: 2,
  TASK: 3,
  DEVELOPER: 4,
  QA: 5,
  STATUS: 6,
  LINK: 7,
  SWAGGER: 8,
};

export const STATUS_IN_USE = "In use";
export const STATUS_NOT_IN_USE = "Not In use";

export const DEFAULT_TASK_HREF_BASE =
  "https://dev.azure.com/timepoint-vsts/eTimePlus/_workitems/edit/";

/** Visible background-color from a tr style, skipping `//` wiki comments. */
export function extractVisibleBackgroundColor(style) {
  if (!style) return "none";
  const match = String(style).match(/background-color\s*:\s*([^;]+)/i);
  if (!match) return "none";
  const value = match[1].trim();
  if (!value || value.startsWith("//")) return "none";
  return resolveColorName(value);
}

/** Normalize background-color from tr style to a CSS color name when possible. */
export function normalizeRowColor(raw) {
  return resolveColorName(raw);
}

export function normalizeStatus(text) {
  return (text || "").trim();
}

export function statusesEqual(a, b) {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

export function isInUseStatus(status, claimStatus = STATUS_IN_USE) {
  return statusesEqual(status, claimStatus);
}

export function colorsEqual(a, b) {
  const left = (a || "none").trim().toLowerCase() || "none";
  const right = (b || "none").trim().toLowerCase() || "none";
  return left === right;
}

function decodeHref(href) {
  return String(href || "")
    .replace(/&amp;/g, "&")
    .replace(/\u00a0/g, "")
    .trim();
}

export function parseTaskFromCell(innerHtml, text) {
  const hrefMatch =
    String(innerHtml || "").match(/href\s*=\s*"([^"]*)"/i) ||
    String(innerHtml || "").match(/href\s*=\s*'([^']*)'/i);
  const href = decodeHref(hrefMatch ? hrefMatch[1] : "");
  const display = String(text || "").trim();
  const idFromHref = (href.match(/\/edit\/(\d+)/) || [])[1] || "";
  const idFromText = (display.match(/^(\d+)/) || [])[1] || "";
  const taskId = idFromHref || idFromText;
  let taskTitle = display;
  if (taskId && display.toLowerCase().startsWith(taskId.toLowerCase())) {
    taskTitle = display.slice(taskId.length).replace(/^\s*[-–—]\s*/, "").trim();
  }
  return {
    task: formatTaskText(taskId, taskTitle) || display,
    taskId,
    taskTitle,
    taskHref: href,
  };
}

export function buildTaskHref(originalHref, id) {
  const href = decodeHref(originalHref);
  if (href) {
    const replaced = href.replace(/\/edit\/\d+\/?/, `/edit/${id}`);
    if (/\/edit\//i.test(replaced)) return replaced;
  }
  return `${DEFAULT_TASK_HREF_BASE}${id}`;
}

export function formatTaskText(taskId, taskTitle) {
  const id = String(taskId || "").trim();
  const title = String(taskTitle || "").trim();
  if (id && title) return `${id} - ${title}`;
  return id || title;
}

const BRANCH_PATTERN =
  /([A-Za-z][\w.-]*)\/TP-(\d+)-([A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)/;

/** `expenses-mileage-updates` -> `Expenses mileage updates`. */
export function slugToTaskTitle(slug) {
  const words = String(slug || "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!words) return "";
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Find the first `prefix/TP-id-slug` branch in free text (clipboard or commit message).
 * @returns {{ branch: string, taskId: string, taskTitle: string, task: string } | null}
 */
export function parseBranchFromText(text) {
  const match = String(text || "").match(BRANCH_PATTERN);
  if (!match) return null;
  const taskId = match[2];
  const taskTitle = slugToTaskTitle(match[3]);
  return {
    branch: match[0],
    taskId,
    taskTitle,
    task: formatTaskText(taskId, taskTitle),
  };
}
