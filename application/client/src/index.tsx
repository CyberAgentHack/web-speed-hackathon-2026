import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { store } from "@web-speed-hackathon-2026/client/src/store";

function preloadCurrentRouteChunk(pathname: string): void {
  if (pathname === "/") {
    void import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer");
    return;
  }
  if (pathname.startsWith("/users/")) {
    void import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer");
    return;
  }
  if (pathname.startsWith("/posts/")) {
    void import("@web-speed-hackathon-2026/client/src/containers/PostContainer");
    return;
  }
  if (pathname === "/search") {
    void import("@web-speed-hackathon-2026/client/src/containers/SearchContainer");
    return;
  }
  if (pathname === "/terms") {
    void import("@web-speed-hackathon-2026/client/src/containers/TermContainer");
    return;
  }
  if (pathname === "/crok") {
    void import("@web-speed-hackathon-2026/client/src/containers/CrokContainer");
    return;
  }
  if (pathname === "/dm" || pathname.startsWith("/dm/")) {
    void import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer");
    void import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer");
  }
}

const appElement = document.getElementById("app");

if (appElement !== null) {
  preloadCurrentRouteChunk(window.location.pathname);

  createRoot(appElement).render(
    <Provider store={store}>
      <BrowserRouter>
        <AppContainer />
      </BrowserRouter>
    </Provider>,
  );
}
