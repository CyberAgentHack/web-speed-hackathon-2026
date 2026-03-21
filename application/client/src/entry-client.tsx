import "./index.css";
import "./buildinfo";
import { createRoot, hydrateRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";
import { SWRConfig } from "swr";

import { SSRDataProvider } from "@web-speed-hackathon-2026/client/src/api/ssr-context";
import { swrConfig } from "@web-speed-hackathon-2026/client/src/api/swr";
import {
  AppContainer,
  type SSRData,
} from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { Document } from "@web-speed-hackathon-2026/client/src/Document";
import { store } from "@web-speed-hackathon-2026/client/src/store";

const ssrData: SSRData | null = ((window as any).__SSR_DATA__ as SSRData | undefined) ?? null;
const cssHref = (window as any).__CSS_HREF__ as string | undefined;

if (ssrData) {
  hydrateRoot(
    document,
    <SSRDataProvider value={ssrData}>
      <Provider store={store}>
        <SWRConfig value={swrConfig}>
          <BrowserRouter unstable_useTransitions={false}>
            <Document cssHref={cssHref}>
              <AppContainer />
            </Document>
          </BrowserRouter>
        </SWRConfig>
      </Provider>
    </SSRDataProvider>,
    { onRecoverableError: () => {} },
  );
  setTimeout(() => {
    delete (window as any).__SSR_DATA__;
  }, 0);
} else {
  const appEl = document.getElementById("app")!;
  createRoot(appEl).render(
    <SSRDataProvider value={null}>
      <Provider store={store}>
        <SWRConfig value={swrConfig}>
          <BrowserRouter unstable_useTransitions={false}>
            <AppContainer />
          </BrowserRouter>
        </SWRConfig>
      </Provider>
    </SSRDataProvider>,
  );
}
