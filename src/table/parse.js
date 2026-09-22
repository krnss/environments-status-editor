import { COLUMNS, normalizeRowColor, normalizeStatus } from "./columns.js";

function cellText(td) {
  if (!td) return "";
  return (td.textContent || "").trim();
}

function extractBackgroundColor(tr) {
  const style = tr.getAttribute("style") || "";
  const match = style.match(/background-color\s*:\s*([^;]+)/i);
  return match ? match[1].trim() : "";
}

function extractLink(td) {
  if (!td) return { text: "", href: "" };
  const a = td.querySelector("a");
  if (a) {
    return {
      text: (a.textContent || "").trim(),
      href: a.getAttribute("href") || "",
    };
  }
  return { text: cellText(td), href: "" };
}

/**
 * Parse wiki textarea HTML into environment row models.
 * @param {string} html
 * @returns {{ environments: object[], tableStart: number, tableEnd: number } | null}
 */
export function parseEnvironmentsTable(html) {
  if (!html || typeof html !== "string") return null;

  const tableStart = html.search(/<table[\s>]/i);
  if (tableStart === -1) return null;

  const tableEnd = html.indexOf("</table>", tableStart);
  if (tableEnd === -1) return null;

  const end = tableEnd + "</table>".length;
  const tableHtml = html.slice(tableStart, end);

  const parser = new DOMParser();
  const doc = parser.parseFromString(tableHtml, "text/html");
  const table = doc.querySelector("table");
  if (!table) return null;

  const bodyRows = table.querySelectorAll("tbody tr");
  const rows = bodyRows.length ? bodyRows : table.querySelectorAll("tr");

  const environments = [];
  let dataIndex = 0;

  for (const tr of rows) {
    if (tr.querySelector("th")) continue;

    const cells = tr.querySelectorAll("td");
    if (cells.length < 7) continue;

    const name = cellText(cells[COLUMNS.NAME]);
    if (!name) continue;

    const link = extractLink(cells[COLUMNS.LINK]);
    const swagger = extractLink(cells[COLUMNS.SWAGGER]);

    environments.push({
      index: dataIndex,
      name,
      repository: cellText(cells[COLUMNS.REPOSITORY]),
      branch: cellText(cells[COLUMNS.BRANCH]),
      task: cellText(cells[COLUMNS.TASK]),
      developer: cellText(cells[COLUMNS.DEVELOPER]),
      qa: cellText(cells[COLUMNS.QA]),
      status: normalizeStatus(cellText(cells[COLUMNS.STATUS])),
      linkText: link.text,
      linkHref: link.href,
      swaggerText: swagger.text,
      swaggerHref: swagger.href,
      rowColor: normalizeRowColor(extractBackgroundColor(tr)),
    });

    dataIndex += 1;
  }

  if (!environments.length) return null;

  return {
    environments,
    tableStart,
    tableEnd: end,
    tableHtml,
  };
}
