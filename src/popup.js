import {
  getSettings,
  saveSettings,
  DEFAULT_SETTINGS,
} from "./utils/storage.js";
import { CSS_COLORS, colorPreviewStyle, getCssColor } from "./utils/css-colors.js";

class SettingsPopup {
  constructor() {
    this.settings = null;
    this.init();
  }

  async init() {
    this.settings = await getSettings();
    this.bindElements();
    this.renderColorGrid();
    this.loadSettings();
    this.bindEvents();
  }

  bindElements() {
    this.enableToggle = document.getElementById("enableToggle");
    this.usersInput = document.getElementById("usersInput");
    this.defaultDeveloper = document.getElementById("defaultDeveloper");
    this.defaultDeveloperList = document.getElementById("defaultDeveloperList");
    this.statusesInput = document.getElementById("statusesInput");
    this.claimStatus = document.getElementById("claimStatus");
    this.releaseStatus = document.getElementById("releaseStatus");
    this.defaultInUseColor = document.getElementById("defaultInUseColor");
    this.defaultColorCircle = document.getElementById("defaultColorCircle");
    this.defaultColorLabel = document.getElementById("defaultColorLabel");
    this.colorGrid = document.getElementById("colorGrid");
    this.resetBtn = document.getElementById("resetBtn");
    this.saveBtn = document.getElementById("saveBtn");
    this.status = document.getElementById("status");
  }

  renderColorGrid() {
    this.colorGrid.innerHTML = CSS_COLORS.map((c) => {
      return `
        <label class="color-item" title="${c.name} ${c.hex}">
          <input type="checkbox" data-color="${c.name}" />
          <span class="color-circle" style="${colorPreviewStyle(c.name)}"></span>
          <span class="color-name">${c.name}</span>
        </label>
      `;
    }).join("");
  }

  linesFromTextarea(el) {
    return el.value
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  loadSettings() {
    this.enableToggle.classList.toggle("active", !!this.settings.enabled);
    this.usersInput.value = (this.settings.users || []).join("\n");
    this.defaultDeveloper.value = this.settings.defaultDeveloper || "";
    this.statusesInput.value = (this.settings.statuses || []).join("\n");

    const enabledSet = new Set(
      (this.settings.enabledColors || []).map((c) => c.toLowerCase())
    );
    this.colorGrid.querySelectorAll("input[type=checkbox]").forEach((cb) => {
      cb.checked = enabledSet.has(cb.dataset.color.toLowerCase());
    });

    this.refreshUserDatalist();
    this.refreshStatusSelects();
    this.refreshDefaultColorSelect();
  }

  refreshUserDatalist() {
    const users = this.linesFromTextarea(this.usersInput);
    this.defaultDeveloperList.innerHTML = users
      .map((u) => `<option value="${escapeAttr(u)}"></option>`)
      .join("");
  }

  refreshStatusSelects() {
    const statuses = this.linesFromTextarea(this.statusesInput);
    const list = statuses.length ? statuses : [...DEFAULT_SETTINGS.statuses];
    const claim = this.settings.claimStatus;
    const release = this.settings.releaseStatus;

    this.claimStatus.innerHTML = list
      .map(
        (s) =>
          `<option value="${escapeAttr(s)}" ${s === claim ? "selected" : ""}>${escapeHtml(s)}</option>`
      )
      .join("");
    this.releaseStatus.innerHTML = list
      .map(
        (s) =>
          `<option value="${escapeAttr(s)}" ${s === release ? "selected" : ""}>${escapeHtml(s)}</option>`
      )
      .join("");
  }

  refreshDefaultColorSelect() {
    const enabled = this.getEnabledColorsFromUi();
    const current = this.settings.defaultInUseColor || "DarkBlue";
    const options = enabled.length ? enabled : ["DarkBlue"];
    if (!options.some((c) => c.toLowerCase() === current.toLowerCase())) {
      options.unshift(current);
    }
    this.defaultInUseColor.innerHTML = options
      .map(
        (c) =>
          `<option value="${escapeAttr(c)}" ${c.toLowerCase() === current.toLowerCase() ? "selected" : ""}>${escapeHtml(c)}</option>`
      )
      .join("");
    this.updateDefaultColorPreview();
  }

  getEnabledColorsFromUi() {
    return [...this.colorGrid.querySelectorAll("input[type=checkbox]:checked")].map(
      (cb) => cb.dataset.color
    );
  }

  updateDefaultColorPreview() {
    const value = this.defaultInUseColor.value || "DarkBlue";
    const known = getCssColor(value);
    this.defaultColorCircle.style.cssText = colorPreviewStyle(value);
    this.defaultColorLabel.textContent = known ? `${known.name} (${known.hex})` : value;
  }

  collectSettings() {
    const statuses = this.linesFromTextarea(this.statusesInput);
    return {
      enabled: this.enableToggle.classList.contains("active"),
      users: this.linesFromTextarea(this.usersInput),
      defaultDeveloper: this.defaultDeveloper.value.trim(),
      statuses: statuses.length ? statuses : [...DEFAULT_SETTINGS.statuses],
      claimStatus: this.claimStatus.value,
      releaseStatus: this.releaseStatus.value,
      enabledColors: this.getEnabledColorsFromUi(),
      defaultInUseColor: this.defaultInUseColor.value || "DarkBlue",
    };
  }

  bindEvents() {
    this.enableToggle.addEventListener("click", () => {
      this.enableToggle.classList.toggle("active");
    });

    this.usersInput.addEventListener("input", () => this.refreshUserDatalist());
    this.statusesInput.addEventListener("input", () => this.refreshStatusSelects());

    this.colorGrid.addEventListener("change", () => {
      this.refreshDefaultColorSelect();
    });

    this.defaultInUseColor.addEventListener("change", () => {
      this.settings.defaultInUseColor = this.defaultInUseColor.value;
      this.updateDefaultColorPreview();
    });

    this.resetBtn.addEventListener("click", async () => {
      this.settings = { ...DEFAULT_SETTINGS, statuses: [...DEFAULT_SETTINGS.statuses], users: [], enabledColors: [...DEFAULT_SETTINGS.enabledColors] };
      this.loadSettings();
      await saveSettings(this.settings);
      this.showStatus("Settings reset to default", "success");
    });

    this.saveBtn.addEventListener("click", async () => {
      this.settings = this.collectSettings();
      if (await saveSettings(this.settings)) {
        this.showStatus("Settings saved", "success");
      } else {
        this.showStatus("Failed to save settings", "error");
      }
    });
  }

  showStatus(message, type) {
    this.status.textContent = message;
    this.status.className = `status ${type}`;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      this.status.className = "status";
      this.status.textContent = "";
    }, 2500);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

document.addEventListener("DOMContentLoaded", () => {
  new SettingsPopup();
});
