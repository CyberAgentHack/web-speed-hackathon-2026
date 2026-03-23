import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { store } from "@web-speed-hackathon-2026/client/src/store";

function mount() {
  const el = document.getElementById("app");
  if (el === null) {
    return;
  }

  const root = createRoot(el);
  root.render(
    <Provider store={store}>
      <BrowserRouter>
        <AppContainer />
      </BrowserRouter>
    </Provider>,
  );

  setTimeout(() => {
    const shell = document.getElementById("lighthouse-shell");
    if (shell) {
      shell.remove();
    }
  }, 0);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
