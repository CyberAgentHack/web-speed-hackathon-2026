import fs from "node:fs/promises";
import path from "node:path";

import React from "../../client/node_modules/react/index.js";
import { createElement } from "../../client/node_modules/react/index.js";
import { renderToStaticMarkup } from "../../client/node_modules/react-dom/server.node.js";

import termsStandaloneShellModule from "../../client/src/components/term/TermsStandaloneShell.tsx";

const applicationRoot = path.resolve(import.meta.dirname, "../..");
const distRoot = path.resolve(applicationRoot, "dist");
const outputPath = path.resolve(distRoot, "terms.html");
const TERMS_AUTH_MODAL_ID = "terms-auth-modal";
const { TermsStandaloneShell } = termsStandaloneShellModule as {
  TermsStandaloneShell: (props: { authModalId: string }) => React.ReactElement;
};

globalThis.React = React;

function resolveScriptPaths() {
  const termsEntryPath = path.resolve(distRoot, "scripts/terms.js");

  return fs
    .access(termsEntryPath)
    .then(() => ["/scripts/vendor.js", "/scripts/terms.js"])
    .catch(() => ["/scripts/vendor.js", "/scripts/main.js"]);
}

async function main() {
  const scripts = await resolveScriptPaths();
  const appMarkup = renderToStaticMarkup(
    createElement(TermsStandaloneShell, { authModalId: TERMS_AUTH_MODAL_ID }),
  );
  const scriptTags = scripts.map((scriptPath) => `<script defer src="${scriptPath}"></script>`).join("");

  const document = [
    "<!doctype html>",
    '<html lang="ja">',
    "<head>",
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    "<title>利用規約 - CaX</title>",
    '<link rel="stylesheet" href="/styles/main.css" />',
    scriptTags,
    "</head>",
    '<body class="bg-cax-canvas text-cax-text">',
    `<div id="app">${appMarkup}</div>`,
    "</body>",
    "</html>",
  ].join("");

  await fs.writeFile(outputPath, document);
}

void main();
