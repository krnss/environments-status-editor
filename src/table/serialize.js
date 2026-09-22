import { COLUMNS, STATUS_IN_USE } from "./columns.js";
import { textColorForBackground } from "../utils/css-colors.js";

function setCellText(td, text) {
  if (!td) return;
  const value = text ?? "";
  // Prefer keeping a single text node; clear child elements for editable text cells
  while (td.firstChild) {
    td.removeChild(td.firstChild);
  }
  td.textContent = value;
}

function applyRowColor(tr, color) {
  if (!color || color === "none") {
    tr.removeAttribute("style");
    return;
  }
  const fg = textColorForBackground(color);
  tr.setAttribute("style", `background-color: ${color}; color: ${fg}`);
}

/**
 * Apply environment edits onto the original table HTML and return full wiki content.
 * @param {string} originalHtml - full textarea value
 * @param {object[]} environments - edited row models (same order/index as parse)
 * @param {{ tableStart: number, tableEnd: number }} bounds
 */
export function serializeEnvironmentsTable(originalHtml, environments, bounds) {
  const { tableStart, tableEnd } = bounds;
  const tableHtml = originalHtml.slice(tableStart, tableEnd);

  const parser = new DOMParser();
  const doc = parser.parseFromString(tableHtml, "text/html");
  const table = doc.querySelector("table");
  if (!table) return originalHtml;

  const bodyRows = table.querySelectorAll("tbody tr");
  const rows = bodyRows.length ? bodyRows : table.querySelectorAll("tr");

  let dataIndex = 0;
  for (const tr of rows) {
    if (tr.querySelector("th")) continue;
    const cells = tr.querySelectorAll("td");
    if (cells.length < 7) continue;

    const env = environments.find((e) => e.index === dataIndex);
    dataIndex += 1;
    if (!env) continue;

    setCellText(cells[COLUMNS.BRANCH], env.branch);
    setCellText(cells[COLUMNS.TASK], env.task);
    setCellText(cells[COLUMNS.DEVELOPER], env.developer);
    setCellText(cells[COLUMNS.QA], env.qa);
    setCellText(cells[COLUMNS.STATUS], env.status || STATUS_IN_USE);

    applyRowColor(tr, env.rowColor);
  }

  // Serialize table element; browsers may wrap in html/body
  const serialized = table.outerHTML;
  return originalHtml.slice(0, tableStart) + serialized + originalHtml.slice(tableEnd);
}
