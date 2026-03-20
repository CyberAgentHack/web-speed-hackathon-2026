import "./index.css";
import "./buildinfo";
import { hydrateRoot, createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";
import { SWRConfig } from "swr";

import { buildSWRFallback } from "@web-speed-hackathon-2026/client/src/api/ssr-fallback";
import { swrConfig } from "@web-speed-hackathon-2026/client/src/api/swr";
import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { store } from "@web-speed-hackathon-2026/client/src/store";

const appEl = document.getElementById("app")!;
const ssrData = (window as any).__SSR_DATA__ as Record<string, unknown> | undefined;
const fallback = buildSWRFallback(window.location.pathname, ssrData as any);

const app = (
  <Provider store={store}>
    <SWRConfig value={{ ...swrConfig, fallback }}>
      <BrowserRouter>
        <AppContainer ssrData={ssrData} />
      </BrowserRouter>
    </SWRConfig>
  </Provider>
);

if (appEl.childElementCount > 0 && ssrData) {
  hydrateRoot(appEl, app);
} else {
  createRoot(appEl).render(app);
}
