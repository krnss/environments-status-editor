import {
  COLUMNS,
  extractVisibleBackgroundColor,
  normalizeStatus,
  parseTaskFromCell,
} from "./columns.js";

function findTagRanges(html, tagName, from = 0, to = html.length) {
  const ranges = [];
  const openRe = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  const closeRe = new RegExp(`</${tagName}\\s*>`, "i");
  const slice = html.slice(from, to);
  let cursor = 0;

  while (cursor < slice.length) {
    openRe.lastIndex = cursor;
    const openMatch = openRe.exec(slice);
    if (!openMatch) break;

    const localStart = openMatch.index;
    const afterOpen = localStart + openMatch[0].length;
    const rest = slice.slice(afterOpen);
    const closeMatch = rest.match(closeRe);
    if (!closeMatch) break;

    const localEnd = afterOpen + closeMatch.index + closeMatch[0].length;
    ranges.push({
      start: from + localStart,
      end: from + localEnd,
      html: slice.slice(localStart, localEnd),
    });
    cursor = localEnd;
  }

  return ranges;
}

function findCells(rowHtml) {
  const cells = [];
  const openRe = /<td\b[^>]*>/gi;
  let cursor = 0;

  while (cursor < rowHtml.length) {
    openRe.lastIndex = cursor;
    const openMatch = openRe.exec(rowHtml);
    if (!openMatch) break;

    const openTag = openMatch[0];
    const innerStart = openMatch.index + openTag.length;
    const rest = rowHtml.slice(innerStart);
    const closeMatch = rest.match(/<\/td\s*>/i);
    if (!closeMatch) break;

    const closeTag = closeMatch[0];
    const inner = rest.slice(0, closeMatch.index);
    const end = innerStart + closeMatch.index + closeTag.length;
    cells.push({
      start: openMatch.index,
      end,
      openTag,
      closeTag,
      inner,
      full: rowHtml.slice(openMatch.index, end),
    });
    cursor = end;
  }

  return cells;
}

function stripTags(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractHref(inner) {
  const match =
    String(inner || "").match(/href\s*=\s*"([^"]*)"/i) ||
    String(inner || "").match(/href\s*=\s*'([^']*)'/i);
  if (!match) return "";
  return match[1].replace(/&amp;/g, "&").replace(/\u00a0/g, "").trim();
}

function extractLink(inner) {
  return {
    text: stripTags(inner),
    href: extractHref(inner),
  };
}

function styleFromOpenTag(openTag) {
  const match =
    String(openTag).match(/style\s*=\s*"([^"]*)"/i) ||
    String(openTag).match(/style\s*=\s*'([^']*)'/i);
  return match ? match[1] : "";
}

function openTrTag(rowHtml) {
  const match = String(rowHtml).match(/^<tr\b[^>]*>/i);
  return match ? match[0] : "<tr>";
}

/**
 * Parse wiki textarea HTML into environment row models.
 * Scans every table and keeps original row/cell source so unchanged markup can be preserved.
 * @param {string} html
 * @returns {{ environments: object[] } | null}
 */
export function parseEnvironmentsTable(html) {
  if (!html || typeof html !== "string") return null;

  const tables = findTagRanges(html, "table");
  if (!tables.length) return null;

  const environments = [];
  let dataIndex = 0;
  let tableNumber = 0;

  for (const table of tables) {
    const tbodies = findTagRanges(html, "tbody", table.start, table.end);
    const searchRanges = tbodies.length ? tbodies : [table];
    const tableEnvs = [];

    for (const range of searchRanges) {
      const rows = findTagRanges(html, "tr", range.start, range.end);
      for (const row of rows) {
        if (/<th\b/i.test(row.html)) continue;

        const cells = findCells(row.html);
        if (cells.length < 7) continue;

        const name = stripTags(cells[COLUMNS.NAME]?.inner);
        if (!name) continue;

        const openTag = openTrTag(row.html);
        const branch = stripTags(cells[COLUMNS.BRANCH]?.inner);
        const developer = stripTags(cells[COLUMNS.DEVELOPER]?.inner);
        const qa = stripTags(cells[COLUMNS.QA]?.inner);
        const status = normalizeStatus(stripTags(cells[COLUMNS.STATUS]?.inner));
        const task = parseTaskFromCell(
          cells[COLUMNS.TASK]?.inner || "",
          stripTags(cells[COLUMNS.TASK]?.inner)
        );
        const link = extractLink(cells[COLUMNS.LINK]?.inner);
        const swagger = extractLink(cells[COLUMNS.SWAGGER]?.inner);
        const rowColor = extractVisibleBackgroundColor(styleFromOpenTag(openTag));

        const env = {
          index: dataIndex,
          tableIndex: tableNumber + 1,
          name,
          repository: stripTags(cells[COLUMNS.REPOSITORY]?.inner),
          branch,
          task: task.task,
          taskId: task.taskId,
          taskTitle: task.taskTitle,
          taskHref: task.taskHref,
          developer,
          qa,
          status,
          linkText: link.text,
          linkHref: link.href,
          swaggerText: swagger.text,
          swaggerHref: swagger.href,
          rowColor,
          original: {
            rowStart: row.start,
            rowEnd: row.end,
            rowHtml: row.html,
            openTag,
            cells,
            repository: stripTags(cells[COLUMNS.REPOSITORY]?.inner),
            branch,
            taskId: task.taskId,
            taskTitle: task.taskTitle,
            taskHref: task.taskHref,
            developer,
            qa,
            status,
            rowColor,
          },
        };

        tableEnvs.push(env);
        dataIndex += 1;
      }
    }

    if (tableEnvs.length) {
      tableNumber += 1;
      for (const env of tableEnvs) {
        env.tableIndex = tableNumber;
        environments.push(env);
      }
    }
  }

  if (!environments.length) return null;

  return { environments };
}
