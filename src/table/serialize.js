import {
  COLUMNS,
  buildTaskHref,
  colorsEqual,
  formatTaskText,
} from "./columns.js";
import { textColorForBackground } from "../utils/css-colors.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textCell(value) {
  return escapeHtml(String(value ?? "").trim());
}

function fieldsEqual(a, b) {
  return String(a ?? "").trim() === String(b ?? "").trim();
}

function buildTaskCellInner(env) {
  const id = String(env.taskId || "").trim();
  const title = String(env.taskTitle || "").trim();
  if (!id && !title) return "";
  if (!id) return textCell(title);
  const href = buildTaskHref(env.original?.taskHref || "", id);
  return `<a href="${escapeHtml(href)}">${escapeHtml(formatTaskText(id, title))}</a>`;
}

function styleFromOpenTag(openTag) {
  const match =
    String(openTag).match(/style\s*=\s*"([^"]*)"/i) ||
    String(openTag).match(/style\s*=\s*'([^']*)'/i);
  return match ? { quote: match[0].includes("'") ? "'" : '"', value: match[1] } : null;
}

/** Prefix visible color values with `//` so the wiki keeps them as comments. */
function commentStyleColorValues(style) {
  let next = String(style);
  next = next.replace(/background-color\s*:\s*([^;]*)/i, (full, value) => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.startsWith("//")) return full;
    return `background-color: //${trimmed}`;
  });
  next = next.replace(/(^|;\s*)color\s*:\s*([^;]*)/gi, (full, prefix, value) => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.startsWith("//")) return full;
    return `${prefix}color: //${trimmed}`;
  });
  return next;
}

function commentOpenTagColors(openTag) {
  const style = styleFromOpenTag(openTag);
  if (!style) return openTag;
  const nextStyle = commentStyleColorValues(style.value);
  if (nextStyle === style.value) return openTag;
  return openTag.replace(
    /style\s*=\s*("[^"]*"|'[^']*')/i,
    `style=${style.quote}${nextStyle}${style.quote}`
  );
}

function buildOpenTrTag(originalOpen, color) {
  const open = originalOpen || "<tr>";
  if (!color || color === "none") {
    return commentOpenTagColors(open);
  }
  const fg = textColorForBackground(color);
  const style = `background-color: ${color}; color: ${fg}`;
  if (/\sstyle\s*=/i.test(open)) {
    return open.replace(/style\s*=\s*("[^"]*"|'[^']*')/i, `style="${style}"`);
  }
  return open.replace(/\s*>$/i, ` style="${style}">`);
}

function applyCellReplacements(rowHtml, cells, replacements) {
  let result = rowHtml;
  const keys = Object.keys(replacements)
    .map(Number)
    .sort((a, b) => b - a);

  for (const index of keys) {
    const cell = cells[index];
    if (!cell) continue;
    result =
      result.slice(0, cell.start) +
      cell.openTag +
      replacements[index] +
      cell.closeTag +
      result.slice(cell.end);
  }

  return result;
}

function rowDiff(env) {
  const original = env.original || {};
  return {
    repository: !fieldsEqual(env.repository, original.repository),
    branch: !fieldsEqual(env.branch, original.branch),
    task: !fieldsEqual(env.taskId, original.taskId) || !fieldsEqual(env.taskTitle, original.taskTitle),
    developer: !fieldsEqual(env.developer, original.developer),
    qa: !fieldsEqual(env.qa, original.qa),
    status: !fieldsEqual(env.status, original.status),
    color: !colorsEqual(env.rowColor, original.rowColor),
  };
}

export function isEnvironmentDirty(env) {
  return Object.values(rowDiff(env)).some(Boolean);
}

function buildRowIfChanged(env) {
  const original = env.original;
  if (!original?.rowHtml) return null;

  const changed = rowDiff(env);
  if (!Object.values(changed).some(Boolean)) return null;

  let rowHtml = original.rowHtml;
  const replacements = {};

  if (changed.repository) replacements[COLUMNS.REPOSITORY] = textCell(env.repository);
  if (changed.branch) replacements[COLUMNS.BRANCH] = textCell(env.branch);
  if (changed.task) replacements[COLUMNS.TASK] = buildTaskCellInner(env);
  if (changed.developer) replacements[COLUMNS.DEVELOPER] = textCell(env.developer);
  if (changed.qa) replacements[COLUMNS.QA] = textCell(env.qa);
  if (changed.status) replacements[COLUMNS.STATUS] = textCell(env.status);

  if (Object.keys(replacements).length) {
    rowHtml = applyCellReplacements(rowHtml, original.cells || [], replacements);
  }

  if (changed.color) {
    const nextOpen = buildOpenTrTag(original.openTag, env.rowColor);
    rowHtml = rowHtml.replace(/^<tr\b[^>]*>/i, nextOpen);
  }

  return rowHtml;
}

/**
 * Overlay panel edits onto freshly parsed rows.
 * Comparison uses the panel snapshot; markup/offsets come from the current wiki HTML.
 */
export function mergeEditedEnvironments(freshList, editedList) {
  const unused = [...(editedList || [])];

  return (freshList || []).map((fresh) => {
    let index = unused.findIndex((env) => env.name === fresh.name);
    if (index === -1) {
      index = unused.findIndex((env) => env.index === fresh.index);
    }
    if (index === -1) return fresh;

    const user = unused.splice(index, 1)[0];
    const userOriginal = user.original || fresh.original;

    return {
      ...fresh,
      repository: user.repository,
      branch: user.branch,
      task: user.task,
      taskId: user.taskId,
      taskTitle: user.taskTitle,
      developer: user.developer,
      qa: user.qa,
      status: user.status,
      rowColor: user.rowColor,
      original: {
        ...fresh.original,
        branch: userOriginal.branch,
        taskId: userOriginal.taskId,
        taskTitle: userOriginal.taskTitle,
        repository: userOriginal.repository,
        taskHref: userOriginal.taskHref || fresh.original?.taskHref || "",
        developer: userOriginal.developer,
        qa: userOriginal.qa,
        status: userOriginal.status,
        rowColor: userOriginal.rowColor,
      },
    };
  });
}

/**
 * Apply environment edits onto the original wiki HTML.
 * Unchanged rows are copied byte-for-byte; only edited `<tr>` elements are replaced.
 * @param {string} originalHtml
 * @param {object[]} environments
 */
export function serializeEnvironmentsTable(originalHtml, environments) {
  if (!originalHtml || !environments?.length) return originalHtml;

  const patches = [];
  for (const env of environments) {
    const nextRow = buildRowIfChanged(env);
    if (nextRow == null) continue;
    const start = env.original?.rowStart;
    const end = env.original?.rowEnd;
    if (typeof start !== "number" || typeof end !== "number") continue;
    patches.push({ start, end, html: nextRow });
  }

  patches.sort((a, b) => b.start - a.start);

  let result = originalHtml;
  for (const patch of patches) {
    result = result.slice(0, patch.start) + patch.html + result.slice(patch.end);
  }
  return result;
}
