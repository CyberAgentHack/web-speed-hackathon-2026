import "./index.css";

import { Buffer } from "buffer";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";

(globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;

const root = document.getElementById("app")!;
// Remove loading indicator injected in HTML
document.getElementById("app-loading")?.remove();

createRoot(root).render(
  <HelmetProvider>
    <BrowserRouter>
      <AppContainer />
    </BrowserRouter>
  </HelmetProvider>,
);
