import { renderToPipeableStream, type RenderToPipeableStreamOptions } from "react-dom/server";
import { Provider } from "react-redux";
import { StaticRouter } from "react-router";
import { combineReducers, legacy_createStore as createStore } from "redux";
import { reducer as formReducer } from "redux-form";

import {
  AppContainer,
  type SSRData,
} from "@web-speed-hackathon-2026/client/src/containers/AppContainer";

export type { SSRData };

export function render(url: string, ssrData: SSRData, opts?: RenderToPipeableStreamOptions) {
  const store = createStore(combineReducers({ form: formReducer }));

  return renderToPipeableStream(
    <Provider store={store}>
      <StaticRouter location={url}>
        <AppContainer ssrData={ssrData} />
      </StaticRouter>
    </Provider>,
    opts,
  );
}
