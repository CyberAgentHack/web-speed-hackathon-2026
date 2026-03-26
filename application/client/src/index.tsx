import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { store } from "@web-speed-hackathon-2026/client/src/store";

// `defer` で読み込む前提で、DOM パース後すぐに起動します（Lighthouse の FCP を前倒し）
const appElement = document.getElementById("app");
if (appElement) {
  createRoot(appElement).render(
    <Provider store={store}>
      <BrowserRouter>
        <AppContainer />
      </BrowserRouter>
    </Provider>,
  );
}
