import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";

const root = ".next";
const manifest = JSON.parse(readFileSync(path.join(root, "app-build-manifest.json"), "utf8"));
const rows = [];
for (const [route, files] of Object.entries(manifest.pages)) {
  if (!route.endsWith("/page") && route !== "/page") continue;
  const scripts = [...new Set([...manifest.pages["/layout"], ...files])].filter((file) => file.endsWith(".js"));
  const bytes = scripts.reduce((sum, file) => sum + gzipSync(readFileSync(path.join(root, file))).length, 0);
  rows.push({ route: route.replace(/\/page$/, "") || "/", gzipBytes: bytes, gzipKiB: Number((bytes / 1024).toFixed(2)), below250KB: bytes < 250000, scripts: scripts.length });
}
console.table(rows);
if (rows.some((row) => !row.below250KB)) process.exitCode = 1;
