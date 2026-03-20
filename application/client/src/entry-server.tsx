import { renderToPipeableStream, type RenderToPipeableStreamOptions } from "react-dom/server";
import { Provider } from "react-redux";
import { StaticRouter } from "react-router";
import { combineReducers, legacy_createStore as createStore } from "redux";
import { reducer as formReducer } from "redux-form";
import { SWRConfig } from "swr";

import { buildSWRFallback } from "@web-speed-hackathon-2026/client/src/api/ssr-fallback";
import { swrConfig } from "@web-speed-hackathon-2026/client/src/api/swr";
import {
  AppContainer,
  type SSRData,
} from "@web-speed-hackathon-2026/client/src/containers/AppContainer";

export type { SSRData };

export function render(url: string, ssrData: SSRData, opts?: RenderToPipeableStreamOptions) {
  const store = createStore(combineReducers({ form: formReducer }));
  const fallback = buildSWRFallback(url, ssrData);

  return renderToPipeableStream(
    <Provider store={store}>
      <SWRConfig value={{ ...swrConfig, fallback }}>
        <StaticRouter location={url}>
          <AppContainer ssrData={ssrData} />
        </StaticRouter>
      </SWRConfig>
    </Provider>,
    opts,
  );
}
