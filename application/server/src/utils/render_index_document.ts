import { promises as fs } from "node:fs";
import path from "node:path";

import { AppBootstrapData } from "@web-speed-hackathon-2026/client/src/bootstrap";
import { CLIENT_DIST_PATH } from "@web-speed-hackathon-2026/server/src/paths";

let cachedIndexTemplate: string | null = null;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function serializeBootstrap(data: unknown) {
  return JSON.stringify(data)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

async function loadIndexTemplate() {
  if (cachedIndexTemplate != null) {
    return cachedIndexTemplate;
  }

  cachedIndexTemplate = await fs.readFile(path.resolve(CLIENT_DIST_PATH, "index.html"), "utf8");
  return cachedIndexTemplate;
}

export async function renderIndexDocument({
  bootstrap,
  title,
}: {
  bootstrap?: AppBootstrapData;
  title: string;
}) {
  const template = await loadIndexTemplate();
  const bootstrapScript =
    bootstrap != null && Object.keys(bootstrap).length > 0
      ? `<script>window.__CAX_BOOTSTRAP__=${serializeBootstrap(bootstrap)}</script>`
      : "";

  return template
    .replace("<title>CaX</title>", `<title>${escapeHtml(title)}</title>`)
    .replace("</body>", `${bootstrapScript}</body>`);
}
