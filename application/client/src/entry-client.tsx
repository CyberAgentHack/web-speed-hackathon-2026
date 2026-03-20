import "./index.css";
import "./buildinfo";
import { hydrateRoot, createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";
import { SWRConfig } from "swr";

import { clearSSRData, getSSRData } from "@web-speed-hackathon-2026/client/src/api/ssr-data";
import { swrConfig } from "@web-speed-hackathon-2026/client/src/api/swr";
import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer.ssr";
import { store } from "@web-speed-hackathon-2026/client/src/store";

const appEl = document.getElementById("app")!;
const ssrData = getSSRData();

const app = (
  <Provider store={store}>
    <SWRConfig value={swrConfig}>
      <BrowserRouter>
        <AppContainer />
      </BrowserRouter>
    </SWRConfig>
  </Provider>
);

if (appEl.childElementCount > 0 && ssrData) {
  hydrateRoot(appEl, app, {
    onRecoverableError: (error: unknown) => {
      console.error("HYDRATION_ERROR:", error);
    },
  });
  // SSR データをクリア（クライアントナビゲーション時に stale データを使わないため）
  // hydration 完了後にクリアする（全コンポーネントが初回レンダーで読み取れるように）
  setTimeout(clearSSRData, 0);
} else {
  createRoot(appEl).render(app);
}
