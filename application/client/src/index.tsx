import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { primePrefetchedJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

// Prime prefetch cache from server-injected bootstrap data
const bootstrapData = (window as any).__CAX_BOOTSTRAP__ as Record<string, unknown> | undefined;
if (bootstrapData != null) {
  for (const [url, data] of Object.entries(bootstrapData)) {
    primePrefetchedJSON(url, data);
  }
  delete (window as any).__CAX_BOOTSTRAP__;
}

createRoot(document.getElementById("app")!).render(
  <BrowserRouter>
    <AppContainer />
  </BrowserRouter>,
);
