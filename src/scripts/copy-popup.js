import fs from "fs";
import path from "path";

const srcDir = path.resolve("src");
const distDir = path.resolve("dist");

const popupSrc = path.join(srcDir, "popup.html");
const popupDest = path.join(distDir, "popup.html");

try {
  fs.copyFileSync(popupSrc, popupDest);
  console.log("popup.html copied to dist folder");

  const assetsDir = path.join(distDir, "assets");
  if (fs.existsSync(assetsDir)) {
    fs.rmSync(assetsDir, { recursive: true, force: true });
    console.log("removed unused dist/assets");
  }
} catch (error) {
  console.error("Failed to copy popup.html:", error.message);
  process.exitCode = 1;
}
