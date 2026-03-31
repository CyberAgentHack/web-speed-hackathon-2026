import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";

// Route-level prefetch: start loading the chunk for the current page early
if (/^\/posts\/[^/?#]+/.test(window.location.pathname)) {
  void import("@web-speed-hackathon-2026/client/src/containers/PostContainer");
}
if (window.location.pathname === "/search") {
  void import("@web-speed-hackathon-2026/client/src/containers/SearchContainer");
}
if (/^\/terms\/?$/.test(window.location.pathname)) {
  void import("@web-speed-hackathon-2026/client/src/containers/TermContainer");
}
if (/^\/crok\/?$/.test(window.location.pathname)) {
  void import("@web-speed-hackathon-2026/client/src/containers/CrokContainer");
}
if (/^\/dm\/?$/.test(window.location.pathname)) {
  void import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer");
}
if (/^\/dm\/[^/?#]+/.test(window.location.pathname)) {
  void import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer");
}

const mount = () => {
  createRoot(document.getElementById("app")!).render(
    <BrowserRouter>
      <AppContainer />
    </BrowserRouter>,
  );
};

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}
