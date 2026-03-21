import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";

hydrateRoot(
  document.getElementById("app")!,
  <BrowserRouter>
    <AppContainer />
  </BrowserRouter>,
);
