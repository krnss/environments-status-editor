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

/** Normalize background-color from tr style to a CSS color name when possible. */
export function normalizeRowColor(raw) {
  return resolveColorName(raw);
}

export function normalizeStatus(text) {
  const value = (text || "").trim();
  return value || STATUS_NOT_IN_USE;
}
