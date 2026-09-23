# Environments Status Editor (Chrome Extension)

Edit the **etimeplus dev environments** Azure DevOps Wiki table with a form instead of raw HTML.

Open the wiki page → click **Edit** → use the floating panel → click **Apply** → save the wiki as usual.

## Features

- Detects the environments wiki edit page and injects a floating editor panel
- Parses every environments HTML table on the wiki page
- Edit **Repository**, **Branch**, **work item / task title**, **Developer**, **QA**, **Status**, and **row color**
- Search and filter by **All / In use / Not in use**
- Apply rewrites only the row you changed; other rows keep their original HTML
- Color circles in the env summary and color picker (W3Schools CSS named colors)
- Developer / QA / Status: select from configured lists or type free text
- Writes updated HTML back so the ADO preview refreshes
- FAB placed in the wiki `dropoverlay` (`position: absolute; top: 16px; right: 20px`)
- Settings popup: users, statuses, enabled colors, claim/release status, defaults

## Installation

1. Install dependencies:

```bash
npm install
```

2. Build (also bumps the patch version in `public/manifest.json`):

```bash
npm run build
```

3. Load into Chrome:
   - Open `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the `dist/` folder

## Usage

1. Open the **etimeplus dev environments** wiki page in Azure DevOps
2. Click **Edit**
3. Use the floating **Environments Status Editor** panel
4. Expand an environment, change fields, click **Apply**
5. Click **Save** on the wiki page

### Claim shortcut

**Claim** sets Status to `In use` (or the configured claim status), sets Developer to your default name, and sets the default row color — even when those fields already have values. If the clipboard contains a branch like `feat/TP-11104-expenses-mileage-updates`, Claim fills Branch with that text, Work item with `11104`, and Task title with `Expenses mileage updates`. QA stays as it is. Nothing is written until **Apply**.

## Settings

Click the extension icon in the Chrome toolbar:

- Enable / disable the extension
- **Users** — one name per line (Developer / QA suggestions)
- **Statuses** — custom status list + Claim / Release mapping
- **Enabled row colors** — check which CSS colors appear in the panel (with circle previews)
- Default developer and default row color

## Development

```bash
npm run dev
```

Rebuilds on file changes. Reload the unpacked extension in Chrome after each build.
