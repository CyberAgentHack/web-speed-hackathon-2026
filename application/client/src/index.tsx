import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";

const mount = () => {
  createRoot(document.getElementById("app")!).render(
    <BrowserRouter>
      <AppContainer />
    </BrowserRouter>,
  );
};

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}
