import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { readBootstrapData } from "@web-speed-hackathon-2026/client/src/bootstrap";
import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";

const rootElement = document.getElementById("app")!;
const bootstrap = readBootstrapData();
const app = (
  <BrowserRouter>
    <AppContainer bootstrap={bootstrap} />
  </BrowserRouter>
);

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
