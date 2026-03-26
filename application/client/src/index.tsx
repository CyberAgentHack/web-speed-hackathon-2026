import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { store } from "@web-speed-hackathon-2026/client/src/store";

// Polyfill for HTML Invoker Commands API (command/commandfor)
if (typeof HTMLButtonElement !== "undefined" && !("commandForElement" in HTMLButtonElement.prototype)) {
  document.addEventListener("click", (e) => {
    const button = (e.target as Element)?.closest?.("button[commandfor]");
    if (!button) return;
    const command = button.getAttribute("command");
    const targetId = button.getAttribute("commandfor");
    if (!targetId) return;
    const target = document.getElementById(targetId);
    if (!target || !(target instanceof HTMLDialogElement)) return;
    if (command === "show-modal" && !target.open) {
      target.showModal();
    } else if (command === "close") {
      target.close();
    }
  });
}

// defer属性付きのため DOMContentLoaded 不要 - 即座にレンダリング開始
createRoot(document.getElementById("app")!).render(
  <Provider store={store}>
    <BrowserRouter>
      <AppContainer />
    </BrowserRouter>
  </Provider>,
);
