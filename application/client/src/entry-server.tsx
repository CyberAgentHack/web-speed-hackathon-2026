import { renderToReadableStream } from "react-dom/server";
import { Provider } from "react-redux";
import { StaticRouter } from "react-router";
import { combineReducers, legacy_createStore as createStore } from "redux";
import { reducer as formReducer } from "redux-form";
import { SWRConfig } from "swr";

import { clearSSRData, setSSRData } from "@web-speed-hackathon-2026/client/src/api/ssr-data";
import { swrConfig } from "@web-speed-hackathon-2026/client/src/api/swr";
import {
  AppContainer,
  type SSRData,
} from "@web-speed-hackathon-2026/client/src/containers/AppContainer.ssr";

export type { SSRData };

export async function render(url: string, ssrData: SSRData): Promise<ReadableStream> {
  setSSRData(ssrData);
  const store = createStore(combineReducers({ form: formReducer }));

  const stream = await renderToReadableStream(
    <Provider store={store}>
      <SWRConfig value={swrConfig}>
        <StaticRouter location={url}>
          <AppContainer />
        </StaticRouter>
      </SWRConfig>
    </Provider>,
    {
      onError(error: unknown) {
        console.error("SSR render error:", error);
      },
    },
  );
  await stream.allReady;
  clearSSRData();
  return stream;
}
