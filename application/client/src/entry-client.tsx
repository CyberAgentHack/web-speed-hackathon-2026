import "./index.css";
import "./buildinfo";
import { createRoot, hydrateRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";
import { SWRConfig } from "swr";

import { clearSSRData, getSSRData } from "@web-speed-hackathon-2026/client/src/api/ssr-data";
import { swrConfig } from "@web-speed-hackathon-2026/client/src/api/swr";
import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { Document } from "@web-speed-hackathon-2026/client/src/Document";
import { store } from "@web-speed-hackathon-2026/client/src/store";

const ssrData = getSSRData();
const cssHref = (window as any).__CSS_HREF__ as string | undefined;

if (ssrData) {
  hydrateRoot(
    document,
    <Provider store={store}>
      <SWRConfig value={swrConfig}>
        <BrowserRouter unstable_useTransitions={false}>
          <Document cssHref={cssHref}>
            <AppContainer />
          </Document>
        </BrowserRouter>
      </SWRConfig>
    </Provider>,
    { onRecoverableError: () => {} },
  );
  setTimeout(clearSSRData, 0);
} else {
  const appEl = document.getElementById("app")!;
  createRoot(appEl).render(
    <Provider store={store}>
      <SWRConfig value={swrConfig}>
        <BrowserRouter unstable_useTransitions={false}>
          <AppContainer />
        </BrowserRouter>
      </SWRConfig>
    </Provider>,
  );
}
