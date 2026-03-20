import "./index.css";
import "./buildinfo";
import { hydrateRoot, createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { store } from "@web-speed-hackathon-2026/client/src/store";

const appEl = document.getElementById("app")!;
const ssrData = (window as any).__SSR_DATA__ as Record<string, unknown> | undefined;

const app = (
  <Provider store={store}>
    <BrowserRouter>
      <AppContainer ssrData={ssrData} />
    </BrowserRouter>
  </Provider>
);

if (appEl.childElementCount > 0 && ssrData) {
  hydrateRoot(appEl, app);
} else {
  createRoot(appEl).render(app);
}
