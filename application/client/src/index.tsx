import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { store } from "@web-speed-hackathon-2026/client/src/store";

const el = document.getElementById("app");
if (!el) throw new Error("Missing #app element");

createRoot(el).render(
  <Provider store={store}>
    <BrowserRouter>
      <AppContainer />
    </BrowserRouter>
  </Provider>,
);
