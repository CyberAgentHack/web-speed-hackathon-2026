import { execSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const DIST = new URL("../../dist", import.meta.url).pathname;
const EXTS = new Set([".js", ".css", ".html", ".svg", ".json"]);

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (EXTS.has(extname(entry.name))) {
      try { execSync(`brotli -fk "${full}"`); } catch {}
      try { execSync(`gzip -fk "${full}"`); } catch {}
    }
  }
}

walk(DIST);
console.log("Pre-compression complete");
