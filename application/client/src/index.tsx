import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";

const el = document.getElementById("app");
if (!el) throw new Error("Missing #app element");

createRoot(el).render(
  <BrowserRouter>
    <AppContainer />
  </BrowserRouter>,
);
