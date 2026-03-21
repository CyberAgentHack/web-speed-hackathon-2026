import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { Provider } from "react-redux";
import { store } from "./store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  context: { queryClient },
  scrollRestoration: true,
  defaultPreload: "viewport",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </QueryClientProvider>,
  );
}

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
