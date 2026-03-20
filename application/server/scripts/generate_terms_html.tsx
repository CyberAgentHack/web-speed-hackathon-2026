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

async function resolveStylePaths() {
  const termsStylePath = path.resolve(distRoot, "styles/terms.css");

  return fs
    .access(termsStylePath)
    .then(() => ["/styles/terms.css"])
    .catch(() => ["/styles/main.css"]);
}

async function main() {
  const styles = await resolveStylePaths();
  const appMarkup = renderToStaticMarkup(
    createElement(TermsStandaloneShell, { authModalId: TERMS_AUTH_MODAL_ID }),
  );
  const styleTags = styles.map((stylePath) => `<link rel="stylesheet" href="${stylePath}" />`).join("");

  const document = [
    "<!doctype html>",
    '<html lang="ja">',
    "<head>",
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    "<title>利用規約 - CaX</title>",
    styleTags,
    "</head>",
    '<body class="bg-cax-canvas text-cax-text">',
    `<div id="app">${appMarkup}</div>`,
    "</body>",
    "</html>",
  ].join("");

  await fs.writeFile(outputPath, document);
}

void main();
