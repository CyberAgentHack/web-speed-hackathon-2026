import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { SWRConfig } from "swr";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";

declare global {
  interface Window {
    __SWR_CACHE__?: Record<string, unknown>;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const rootElement = document.getElementById("app")!;

  // サーバー側から埋め込まれたSWRキャッシュを取得
  const cacheStr = document.getElementById('swr-cache')?.textContent;
  const swrCache = cacheStr ? JSON.parse(cacheStr) : {};

  const app = (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        errorRetryCount: 0,
        fallback: swrCache,
      }}
    >
      <BrowserRouter>
        <AppContainer />
      </BrowserRouter>
    </SWRConfig>
  );

  if (rootElement.hasChildNodes()) {
    hydrateRoot(rootElement, app);
    return;
  }

  createRoot(rootElement).render(app);
});
