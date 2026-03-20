import "./index.css";
import "./buildinfo";
import { hydrateRoot, createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";
import { SWRConfig } from "swr";

import { buildSWRFallback } from "@web-speed-hackathon-2026/client/src/api/ssr-fallback";
import { swrConfig } from "@web-speed-hackathon-2026/client/src/api/swr";
import {
  AppContainer,
  type SSRData,
} from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { store } from "@web-speed-hackathon-2026/client/src/store";

const appEl = document.getElementById("app")!;
const ssrData = (window as any).__SSR_DATA__ as SSRData | undefined;
const fallback = buildSWRFallback(window.location.pathname + window.location.search, ssrData);

const app = (
  <Provider store={store}>
    <SWRConfig value={{ ...swrConfig, fallback }}>
      <BrowserRouter>
        <AppContainer />
      </BrowserRouter>
    </SWRConfig>
  </Provider>
);

if (appEl.childElementCount > 0 && ssrData) {
  hydrateRoot(appEl, app);
} else {
  createRoot(appEl).render(app);
}
