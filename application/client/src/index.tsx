import { createRoot, hydrateRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { store } from "@web-speed-hackathon-2026/client/src/store";

const appEl = document.getElementById("app")!;
const app = (
  <Provider store={store}>
    <BrowserRouter>
      <AppContainer />
    </BrowserRouter>
  </Provider>
);

if (appEl.hasChildNodes()) {
  hydrateRoot(appEl, app);
} else {
  createRoot(appEl).render(app);
}
