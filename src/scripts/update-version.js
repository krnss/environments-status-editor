import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const manifestPath = path.resolve(__dirname, "../../public/manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

function incrementVersion(version) {
  const parts = version.split(".");
  parts[2] = (parseInt(parts[2], 10) + 1).toString();
  return parts.join(".");
}

manifest.version = incrementVersion(manifest.version);

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`Version updated to ${manifest.version}`);
