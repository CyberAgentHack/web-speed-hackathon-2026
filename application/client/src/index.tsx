import { createRoot, hydrateRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";

import { SSRDataContext } from "@web-speed-hackathon-2026/client/src/contexts/SSRDataContext";
import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { store } from "@web-speed-hackathon-2026/client/src/store";

declare global {
  interface Window {
    __SSR_DATA__?: {
      routeData: Record<string, unknown>;
      activeUser: Models.User | null;
    };
  }
}

const ssrData = window.__SSR_DATA__;
const container = document.getElementById("app")!;

const app = (
  <Provider store={store}>
    <BrowserRouter>
      <SSRDataContext.Provider value={ssrData?.routeData ?? null}>
        <AppContainer ssrActiveUser={ssrData ? ssrData.activeUser : undefined} />
      </SSRDataContext.Provider>
    </BrowserRouter>
  </Provider>
);

if (ssrData && container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
