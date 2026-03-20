import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { store } from "@web-speed-hackathon-2026/client/src/store";

function renderApp() {
  const app = document.getElementById("app");
  if (app == null) {
    return;
  }

  createRoot(app).render(
    <Provider store={store}>
      <BrowserRouter> 
        <AppContainer />
      </BrowserRouter>
    </Provider>,
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderApp, { once: true });
} else {
  renderApp();
}