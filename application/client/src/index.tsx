import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { store } from "@web-speed-hackathon-2026/client/src/store";

window.addEventListener("load", async () => {
  if (process.env["ENABLE_REACT_SCAN"] === "1") {
    const { scan } = await import("react-scan");
    scan({
      enabled: true,
    });
  }

  createRoot(document.getElementById("app")!).render(
    <Provider store={store}>
      <BrowserRouter>
        <AppContainer />
      </BrowserRouter>
    </Provider>,
  );
});
