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
        <Suspense fallback={<div className="p-10 text-center">読み込み中...</div>}>
          <AppContainer />
        </Suspense>
      </BrowserRouter>
    </Provider>
  );
}
