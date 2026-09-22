import { EnvironmentsPanel, removePanelArtifacts } from "./ui/panel.js";
import {
  isEnvironmentsWikiPage,
  isWikiEditMode,
  findWikiTextarea,
} from "./utils/dom.js";
import { observePageChanges } from "./utils/observer.js";
import { isEnabled, getSettings } from "./utils/storage.js";
import { parseEnvironmentsTable } from "./table/parse.js";

let panel = null;
let lastActive = false;

async function syncUi() {
  const enabled = await isEnabled();
  const onEnvPage = isEnvironmentsWikiPage();
  const editMode = isWikiEditMode();
  const textarea = findWikiTextarea();
  const hasTable =
    !!textarea && !!parseEnvironmentsTable(textarea.value || "");

  const shouldShow = enabled && onEnvPage && editMode && hasTable;

  if (shouldShow) {
    if (!panel) {
      panel = new EnvironmentsPanel();
      await panel.mount();
    } else {
      await panel.mount();
      panel.ensureFab();
    }
    // Keep FAB visible; don't auto-open panel every SPA tick
    if (!lastActive) {
      // freshly entered edit mode — show FAB only
      panel.hide();
    }
    lastActive = true;
  } else {
    if (panel) {
      panel.unmount();
      panel = null;
    } else {
      removePanelArtifacts();
    }
    lastActive = false;
  }
}

async function start() {
  await syncUi();
  observePageChanges(() => {
    syncUi().catch(() => {});
  }, 400);

  // React to settings changes from popup
  try {
    chrome.storage?.onChanged?.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.environmentsStatusEditorSettings) {
        if (panel) {
          panel.refreshSettings().catch(() => {});
        }
        syncUi().catch(() => {});
      }
    });
  } catch {
    // ignore
  }

  // Periodic light check — ADO sometimes mutates without useful observer noise
  setInterval(() => {
    syncUi().catch(() => {});
  }, 2000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    start().catch(console.error);
  });
} else {
  start().catch(console.error);
}

// Warm settings cache
getSettings().catch(() => {});
