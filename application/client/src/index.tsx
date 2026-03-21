import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";
import { Suspense } from "react";
import { AppContainer } from "./containers/AppContainer";
import { store } from "./store";

const container = document.getElementById("app");
if (container) {
  createRoot(container).render(
    <Provider store={store}>
      <BrowserRouter>
        <Suspense fallback={<div>起動中...</div>}>
          <AppContainer />
        </Suspense>
      </BrowserRouter>
    </Provider>
  );
}
