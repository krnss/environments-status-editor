const SETTINGS_KEY = "environmentsStatusEditorSettings";

export const DEFAULT_STATUSES = ["In use", "Not In use"];

export const DEFAULT_ENABLED_COLORS = [
  "DarkBlue",
  "Teal",
  "DarkCyan",
  "Crimson",
  "DarkGreen",
  "DarkOrange",
  "Purple",
  "SteelBlue",
];

export const DEFAULT_SETTINGS = {
  enabled: true,
  defaultDeveloper: "",
  defaultInUseColor: "DarkBlue",
  claimStatus: "In use",
  releaseStatus: "Not In use",
  statuses: [...DEFAULT_STATUSES],
  users: [],
  enabledColors: [...DEFAULT_ENABLED_COLORS],
};

function normalizeList(value, fallback) {
  if (!Array.isArray(value)) return [...fallback];
  return value.map((v) => String(v).trim()).filter(Boolean);
}

export function normalizeSettings(raw = {}) {
  const merged = { ...DEFAULT_SETTINGS, ...raw };
  merged.statuses = normalizeList(merged.statuses, DEFAULT_STATUSES);
  if (!merged.statuses.length) merged.statuses = [...DEFAULT_STATUSES];

  merged.users = normalizeList(merged.users, []);
  merged.enabledColors = normalizeList(merged.enabledColors, DEFAULT_ENABLED_COLORS);

  if (!merged.claimStatus || !merged.statuses.includes(merged.claimStatus)) {
    merged.claimStatus = merged.statuses[0];
  }
  if (!merged.releaseStatus || !merged.statuses.includes(merged.releaseStatus)) {
    merged.releaseStatus =
      merged.statuses.find((s) => /not/i.test(s)) || merged.statuses[merged.statuses.length - 1];
  }

  if (
    merged.defaultInUseColor &&
    merged.defaultInUseColor !== "none" &&
    !merged.enabledColors.some(
      (c) => c.toLowerCase() === String(merged.defaultInUseColor).toLowerCase()
    )
  ) {
    merged.enabledColors = [merged.defaultInUseColor, ...merged.enabledColors];
  }

  return merged;
}

export async function getSettings() {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const result = await chrome.storage.local.get(SETTINGS_KEY);
      return normalizeSettings(result[SETTINGS_KEY] || {});
    }
  } catch {
    // fall through
  }
  return normalizeSettings();
}

export async function saveSettings(settings) {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.set({
        [SETTINGS_KEY]: normalizeSettings(settings),
      });
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export async function updateSetting(key, value) {
  const settings = await getSettings();
  settings[key] = value;
  return saveSettings(settings);
}

export async function isEnabled() {
  const settings = await getSettings();
  return settings.enabled !== false;
}
