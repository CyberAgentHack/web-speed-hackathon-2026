import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { store } from "@web-speed-hackathon-2026/client/src/store";

const appNode = document.getElementById("app");

if (appNode != null) {
  createRoot(appNode).render(
    <Provider store={store}>
      <BrowserRouter>
        <AppContainer />
      </BrowserRouter>
    </Provider>,
  );

  if (document.body.dataset["hasPrerender"] === "1") {
    window.requestAnimationFrame(() => {
      document.body.dataset["appMounted"] = "1";
      document.getElementById("prerender-shell")?.remove();
    });
  }
}
