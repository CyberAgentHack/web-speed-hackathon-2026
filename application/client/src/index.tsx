import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { store } from "@web-speed-hackathon-2026/client/src/store";

createRoot(document.getElementById("app")!).render(
  <Provider store={store}>
    <BrowserRouter>
      <AppContainer />
    </BrowserRouter>
  </Provider>,
);

declare global {
  var __BUILD_INFO__: {
    BUILD_DATE: string | undefined;
    COMMIT_HASH: string | undefined;
  };
}

/** @note 競技用サーバーで参照します。可能な限りコード内に含めてください */
window.__BUILD_INFO__ = {
  BUILD_DATE: import.meta.env["BUILD_DATE"],
  COMMIT_HASH: import.meta.env["COMMIT_HASH"],
};

export {};
