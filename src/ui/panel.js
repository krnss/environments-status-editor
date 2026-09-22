import { parseEnvironmentsTable } from "../table/parse.js";
import { serializeEnvironmentsTable } from "../table/serialize.js";
import { colorPreviewStyle } from "../utils/css-colors.js";
import { readWikiTextarea, writeWikiTextarea } from "../utils/dom.js";
import { getSettings } from "../utils/storage.js";

const ROOT_ID = "ese-panel-root";
const STYLE_ID = "ese-panel-styles";
const FAB_HOST_SELECTOR = "div.dropoverlay.flex-column.flex-grow";

const PANEL_CSS = `
#${ROOT_ID} {
  --ese-bg: #1b1a19;
  --ese-panel: #252423;
  --ese-border: #3b3a39;
  --ese-text: #f3f2f1;
  --ese-muted: #a19f9d;
  --ese-accent: #0078d4;
  --ese-accent-hover: #106ebe;
  --ese-input: #323130;
  font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 13px;
  color: var(--ese-text);
  z-index: 2147483646;
  position: fixed;
  top: 72px;
  right: 16px;
  width: 400px;
  max-height: calc(100vh - 96px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 28px rgba(0,0,0,0.45);
  border: 1px solid var(--ese-border);
  border-radius: 6px;
  background: var(--ese-panel);
  overflow: hidden;
}
#${ROOT_ID}.ese-collapsed { width: auto; max-height: none; }
#${ROOT_ID} .ese-header {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 10px 12px; background: var(--ese-bg); border-bottom: 1px solid var(--ese-border);
  cursor: move; user-select: none;
}
#${ROOT_ID} .ese-title { font-weight: 600; font-size: 14px; white-space: nowrap; }
#${ROOT_ID} .ese-header-actions { display: flex; gap: 6px; }
#${ROOT_ID} .ese-icon-btn {
  background: transparent; border: 1px solid var(--ese-border); color: var(--ese-text);
  border-radius: 4px; width: 28px; height: 28px; cursor: pointer; line-height: 1;
}
#${ROOT_ID} .ese-icon-btn:hover { background: var(--ese-input); }
#${ROOT_ID} .ese-body { overflow: auto; padding: 8px; flex: 1; }
#${ROOT_ID} .ese-empty { padding: 16px; color: var(--ese-muted); text-align: center; }
#${ROOT_ID} .ese-env {
  border: 1px solid var(--ese-border); border-radius: 4px; margin-bottom: 8px;
  background: var(--ese-bg); overflow: hidden;
}
#${ROOT_ID} .ese-env-summary {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 8px 10px; cursor: pointer;
}
#${ROOT_ID} .ese-env-summary:hover { background: #2d2c2b; }
#${ROOT_ID} .ese-env-summary-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
#${ROOT_ID} .ese-env-summary-text { min-width: 0; }
#${ROOT_ID} .ese-env-name { font-weight: 600; }
#${ROOT_ID} .ese-color-circle {
  width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0;
  box-sizing: border-box;
}
#${ROOT_ID} .ese-badge {
  font-size: 11px; padding: 2px 6px; border-radius: 3px;
  background: var(--ese-input); color: var(--ese-muted); white-space: nowrap;
}
#${ROOT_ID} .ese-env-form {
  display: none; padding: 8px 10px 10px; border-top: 1px solid var(--ese-border);
  gap: 8px; flex-direction: column;
}
#${ROOT_ID} .ese-env.open .ese-env-form { display: flex; }
#${ROOT_ID} .ese-meta { color: var(--ese-muted); font-size: 11px; line-height: 1.4; }
#${ROOT_ID} .ese-field { display: flex; flex-direction: column; gap: 4px; }
#${ROOT_ID} .ese-field label { color: var(--ese-muted); font-size: 11px; }
#${ROOT_ID} .ese-field input,
#${ROOT_ID} .ese-field select {
  background: var(--ese-input); border: 1px solid var(--ese-border); color: var(--ese-text);
  border-radius: 4px; padding: 6px 8px; font-size: 13px; width: 100%; box-sizing: border-box;
}
#${ROOT_ID} .ese-field input:focus,
#${ROOT_ID} .ese-field select:focus {
  outline: 1px solid var(--ese-accent); border-color: var(--ese-accent);
}
#${ROOT_ID} .ese-color-grid {
  display: flex; flex-wrap: wrap; gap: 6px;
}
#${ROOT_ID} .ese-color-option {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 8px 4px 4px; border-radius: 14px; cursor: pointer;
  border: 1px solid var(--ese-border); background: var(--ese-input); color: var(--ese-text);
  font-size: 11px;
}
#${ROOT_ID} .ese-color-option.selected {
  border-color: var(--ese-accent); box-shadow: 0 0 0 1px var(--ese-accent);
}
#${ROOT_ID} .ese-color-option .ese-color-circle { width: 16px; height: 16px; }
#${ROOT_ID} .ese-row-actions { display: flex; gap: 6px; margin-top: 4px; }
#${ROOT_ID} .ese-btn {
  border: none; border-radius: 4px; padding: 6px 10px; cursor: pointer;
  font-size: 12px; font-weight: 600;
}
#${ROOT_ID} .ese-btn-primary { background: var(--ese-accent); color: #fff; }
#${ROOT_ID} .ese-btn-primary:hover { background: var(--ese-accent-hover); }
#${ROOT_ID} .ese-btn-secondary {
  background: var(--ese-input); color: var(--ese-text); border: 1px solid var(--ese-border);
}
#${ROOT_ID} .ese-btn-danger {
  background: transparent; color: #f1707b; border: 1px solid #8a2a2e;
}
#${ROOT_ID} .ese-footer {
  display: flex; gap: 8px; padding: 10px 12px;
  border-top: 1px solid var(--ese-border); background: var(--ese-bg);
}
#${ROOT_ID} .ese-footer .ese-btn { flex: 1; padding: 8px 10px; }
#${ROOT_ID} .ese-status-msg {
  padding: 6px 12px; font-size: 12px; display: none; border-top: 1px solid var(--ese-border);
}
#${ROOT_ID} .ese-status-msg.show { display: block; }
#${ROOT_ID} .ese-status-msg.ok { background: #0b2a0b; color: #9fd89f; }
#${ROOT_ID} .ese-status-msg.err { background: #3b1214; color: #f1aeb5; }
#${ROOT_ID}.ese-collapsed .ese-body,
#${ROOT_ID}.ese-collapsed .ese-footer,
#${ROOT_ID}.ese-collapsed .ese-status-msg { display: none; }

div.dropoverlay.flex-column.flex-grow {
  position: relative;
}
#ese-fab {
  position: absolute;
  top: 16px;
  right: 20px;
  z-index: 20;
  background: #0078d4;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 8px 14px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
}
#ese-fab:hover { background: #106ebe; }
`;

function ensureStyles() {
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.documentElement.appendChild(style);
  }
  style.textContent = PANEL_CSS;
}

function cloneEnvs(environments) {
  return environments.map((e) => ({ ...e }));
}

function findFabHost() {
  return document.querySelector(FAB_HOST_SELECTOR);
}

function datalistOptions(values, current) {
  const list = [...values];
  if (current && !list.includes(current)) list.push(current);
  return list.map((v) => `<option value="${escapeAttr(v)}"></option>`).join("");
}

function colorChoices(settings, current) {
  const enabled = settings.enabledColors || [];
  const choices = ["none", ...enabled];
  if (current && current !== "none" && !choices.some((c) => c.toLowerCase() === current.toLowerCase())) {
    choices.push(current);
  }
  return choices;
}

export class EnvironmentsPanel {
  constructor() {
    this.root = null;
    this.fab = null;
    this.environments = [];
    this.bounds = null;
    this.originalHtml = "";
    this.expandedIndex = null;
    this.settings = null;
    this.visible = false;
    this._eventsBound = false;
  }

  async mount() {
    ensureStyles();
    this.settings = await getSettings();
    this.ensureFab();

    if (document.getElementById(ROOT_ID)) {
      this.root = document.getElementById(ROOT_ID);
      return;
    }

    this.root = document.createElement("div");
    this.root.id = ROOT_ID;
    this.root.style.display = "none";
    this.root.innerHTML = `
      <div class="ese-header">
        <div class="ese-title">Environments Status</div>
        <div class="ese-header-actions">
          <button type="button" class="ese-icon-btn" data-action="reload" title="Reload from editor">↻</button>
          <button type="button" class="ese-icon-btn" data-action="collapse" title="Collapse">–</button>
          <button type="button" class="ese-icon-btn" data-action="close" title="Close">×</button>
        </div>
      </div>
      <div class="ese-body"></div>
      <div class="ese-status-msg"></div>
      <div class="ese-footer">
        <button type="button" class="ese-btn ese-btn-secondary" data-action="reload">Reload</button>
        <button type="button" class="ese-btn ese-btn-primary" data-action="apply">Apply</button>
      </div>
    `;
    document.body.appendChild(this.root);
    this.bindRootEvents();
    this.enableDrag();
  }

  ensureFab() {
    const host = findFabHost();
    if (!host) return;

    if (!this.fab || !document.getElementById("ese-fab")) {
      this.fab = document.createElement("button");
      this.fab.id = "ese-fab";
      this.fab.type = "button";
      this.fab.textContent = "Env Editor";
      this.fab.addEventListener("click", () => this.show());
    }

    if (this.fab.parentElement !== host) {
      host.appendChild(this.fab);
    }

    if (!this.visible) {
      this.fab.style.display = "block";
    }
  }

  async refreshSettings() {
    this.settings = await getSettings();
    if (this.visible) this.renderList();
  }

  unmount() {
    this.root?.remove();
    this.fab?.remove();
    this.root = null;
    this.fab = null;
    this.visible = false;
    this._eventsBound = false;
  }

  show() {
    if (!this.root) return;
    this.visible = true;
    this.root.style.display = "flex";
    this.root.classList.remove("ese-collapsed");
    if (this.fab) this.fab.style.display = "none";
    this.reloadFromTextarea();
  }

  hide() {
    if (!this.root) return;
    this.visible = false;
    this.root.style.display = "none";
    this.ensureFab();
    if (this.fab) this.fab.style.display = "block";
  }

  bindRootEvents() {
    if (this._eventsBound) return;
    this._eventsBound = true;

    this.root.addEventListener("click", (e) => {
      const colorOpt = e.target.closest(".ese-color-option");
      if (colorOpt && this.root.contains(colorOpt)) {
        const index = Number(colorOpt.getAttribute("data-index"));
        const color = colorOpt.getAttribute("data-color");
        const env = this.environments.find((x) => x.index === index);
        if (env) {
          env.rowColor = color;
          this.renderList();
        }
        return;
      }

      const actionBtn = e.target.closest("[data-action]");
      if (!actionBtn || !this.root.contains(actionBtn)) return;

      const action = actionBtn.getAttribute("data-action");
      if (action === "close") {
        this.hide();
        return;
      }
      if (action === "collapse") {
        this.root.classList.toggle("ese-collapsed");
        return;
      }
      if (action === "reload") {
        this.reloadFromTextarea();
        this.showStatus("Reloaded from editor", "ok");
        return;
      }
      if (action === "apply") {
        this.apply();
        return;
      }
      if (action === "release") {
        this.releaseEnv(Number(actionBtn.getAttribute("data-index")));
        return;
      }
      if (action === "claim") {
        this.claimEnv(Number(actionBtn.getAttribute("data-index")));
        return;
      }
      if (action === "toggle") {
        const index = Number(actionBtn.getAttribute("data-index"));
        this.expandedIndex = this.expandedIndex === index ? null : index;
        this.renderList();
      }
    });

    this.root.addEventListener("change", (e) => {
      const field = e.target.getAttribute("data-field");
      if (!field) return;
      const index = Number(e.target.getAttribute("data-index"));
      const env = this.environments.find((x) => x.index === index);
      if (!env) return;

      env[field] = e.target.value;

      if (field === "status") {
        const claim = this.settings?.claimStatus || "In use";
        if (env.status === claim && (!env.rowColor || env.rowColor === "none")) {
          env.rowColor = this.settings?.defaultInUseColor || "DarkBlue";
          this.renderList();
        }
      }
    });

    this.root.addEventListener("input", (e) => {
      const field = e.target.getAttribute("data-field");
      if (!field) return;
      const index = Number(e.target.getAttribute("data-index"));
      const env = this.environments.find((x) => x.index === index);
      if (!env) return;
      env[field] = e.target.value;
    });
  }

  enableDrag() {
    const header = this.root.querySelector(".ese-header");
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener("mousedown", (e) => {
      if (e.target.closest("button")) return;
      dragging = true;
      const rect = this.root.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const x = Math.min(window.innerWidth - 40, Math.max(0, e.clientX - offsetX));
      const y = Math.min(window.innerHeight - 40, Math.max(0, e.clientY - offsetY));
      this.root.style.left = `${x}px`;
      this.root.style.top = `${y}px`;
      this.root.style.right = "auto";
    });

    window.addEventListener("mouseup", () => {
      dragging = false;
    });
  }

  reloadFromTextarea() {
    this.originalHtml = readWikiTextarea();
    const parsed = parseEnvironmentsTable(this.originalHtml);
    if (!parsed) {
      this.environments = [];
      this.bounds = null;
      this.renderList();
      this.showStatus("No environments table found in editor", "err");
      return false;
    }
    this.environments = cloneEnvs(parsed.environments);
    this.bounds = {
      tableStart: parsed.tableStart,
      tableEnd: parsed.tableEnd,
    };
    this.renderList();
    return true;
  }

  renderList() {
    const body = this.root.querySelector(".ese-body");
    if (!this.environments.length) {
      body.innerHTML = `<div class="ese-empty">No environments found.<br>Open Edit on the environments wiki page.</div>`;
      return;
    }

    const settings = this.settings || {};
    const statuses = settings.statuses || ["In use", "Not In use"];
    const users = settings.users || [];
    const claimStatus = settings.claimStatus || "In use";

    body.innerHTML = this.environments
      .map((env) => {
        const open = this.expandedIndex === env.index ? "open" : "";
        const isClaim = env.status === claimStatus;
        const colors = colorChoices(settings, env.rowColor);
        const circleStyle = colorPreviewStyle(env.rowColor);

        const colorPicker = colors
          .map((c) => {
            const selected = (env.rowColor || "none").toLowerCase() === c.toLowerCase() ? "selected" : "";
            const label = c === "none" ? "none" : c;
            return `
              <button type="button" class="ese-color-option ${selected}"
                data-index="${env.index}" data-color="${escapeAttr(c)}" title="${escapeAttr(label)}">
                <span class="ese-color-circle" style="${colorPreviewStyle(c)}"></span>
                <span>${escapeHtml(label)}</span>
              </button>`;
          })
          .join("");

        return `
          <div class="ese-env ${open}" data-index="${env.index}">
            <div class="ese-env-summary" data-action="toggle" data-index="${env.index}">
              <div class="ese-env-summary-left">
                <span class="ese-color-circle" style="${circleStyle}" title="${escapeAttr(env.rowColor || "none")}"></span>
                <div class="ese-env-summary-text">
                  <div class="ese-env-name">${escapeHtml(env.name)}</div>
                  <div class="ese-meta">${escapeHtml(env.developer || "—")} · ${escapeHtml(env.branch || "—")}</div>
                </div>
              </div>
              <span class="ese-badge ${isClaim ? "in-use" : ""}">${escapeHtml(env.status)}</span>
            </div>
            <div class="ese-env-form">
              <div class="ese-meta">
                Repo: ${escapeHtml(env.repository || "—")}
                ${env.linkHref ? `<br>Link: ${escapeHtml(env.linkText || env.linkHref)}` : ""}
              </div>
              <div class="ese-field">
                <label>Branch</label>
                <input data-field="branch" data-index="${env.index}" value="${escapeAttr(env.branch)}" />
              </div>
              <div class="ese-field">
                <label>Task</label>
                <input data-field="task" data-index="${env.index}" value="${escapeAttr(env.task)}" />
              </div>
              <div class="ese-field">
                <label>Developer</label>
                <input list="ese-users-${env.index}" data-field="developer" data-index="${env.index}" value="${escapeAttr(env.developer)}" placeholder="Select or type" />
                <datalist id="ese-users-${env.index}">${datalistOptions(users, env.developer)}</datalist>
              </div>
              <div class="ese-field">
                <label>QA</label>
                <input list="ese-qa-${env.index}" data-field="qa" data-index="${env.index}" value="${escapeAttr(env.qa)}" placeholder="Select or type" />
                <datalist id="ese-qa-${env.index}">${datalistOptions(users, env.qa)}</datalist>
              </div>
              <div class="ese-field">
                <label>Status</label>
                <input list="ese-status-${env.index}" data-field="status" data-index="${env.index}" value="${escapeAttr(env.status)}" placeholder="Select or type" />
                <datalist id="ese-status-${env.index}">${datalistOptions(statuses, env.status)}</datalist>
              </div>
              <div class="ese-field">
                <label>Row color</label>
                <div class="ese-color-grid">${colorPicker}</div>
              </div>
              <div class="ese-row-actions">
                <button type="button" class="ese-btn ese-btn-secondary" data-action="claim" data-index="${env.index}">Claim</button>
                <button type="button" class="ese-btn ese-btn-danger" data-action="release" data-index="${env.index}">Release</button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  async claimEnv(index) {
    const env = this.environments.find((x) => x.index === index);
    if (!env) return;
    this.settings = await getSettings();
    env.status = this.settings.claimStatus || "In use";
    if (!env.developer && this.settings.defaultDeveloper) {
      env.developer = this.settings.defaultDeveloper;
    }
    if (!env.rowColor || env.rowColor === "none") {
      env.rowColor = this.settings.defaultInUseColor || "DarkBlue";
    }
    this.renderList();
  }

  async releaseEnv(index) {
    const env = this.environments.find((x) => x.index === index);
    if (!env) return;
    this.settings = await getSettings();
    env.status = this.settings.releaseStatus || "Not In use";
    env.task = "";
    env.developer = "";
    env.qa = "";
    env.rowColor = "none";
    this.renderList();
  }

  apply() {
    if (!this.bounds || !this.environments.length) {
      this.showStatus("Nothing to apply", "err");
      return;
    }

    const currentHtml = readWikiTextarea();
    const parsed = parseEnvironmentsTable(currentHtml);
    if (!parsed) {
      this.showStatus("Table missing from editor", "err");
      return;
    }

    const nextHtml = serializeEnvironmentsTable(currentHtml, this.environments, {
      tableStart: parsed.tableStart,
      tableEnd: parsed.tableEnd,
    });

    if (!writeWikiTextarea(nextHtml)) {
      this.showStatus("Could not write to editor", "err");
      return;
    }

    this.originalHtml = nextHtml;
    const reparsed = parseEnvironmentsTable(nextHtml);
    if (reparsed) {
      this.bounds = {
        tableStart: reparsed.tableStart,
        tableEnd: reparsed.tableEnd,
      };
    }

    this.showStatus("Applied — click Save on the wiki page", "ok");
  }

  showStatus(message, type) {
    const el = this.root.querySelector(".ese-status-msg");
    el.textContent = message;
    el.className = `ese-status-msg show ${type}`;
    clearTimeout(this._statusTimer);
    this._statusTimer = setTimeout(() => {
      el.className = "ese-status-msg";
    }, 3500);
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

export function removePanelArtifacts() {
  document.getElementById(ROOT_ID)?.remove();
  document.getElementById("ese-fab")?.remove();
}
